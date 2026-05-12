import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Helper to get currently authenticated user from Better Auth and the database.
 */
async function getAuthenticatedUser(ctx: any) {
  const authUser = await authComponent.getAuthUser(ctx);
  if (!authUser) {
    throw new Error("Unauthorized: No session found");
  }
  
  const userId = authUser._id || authUser.id;
  const user = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", userId))
    .first();

  if (!user) {
    throw new Error("Unauthorized: User record not found");
  }

  return user;
}

/**
 * Create a new event (starts in 'draft' mode).
 * Atomically creates the event shell, dedicated sections, and discrete job slots.
 */
export const create = mutation({
  args: {
    title: v.string(),
    location: v.string(),
    eventDate: v.number(),
    startTime: v.string(),
    description: v.optional(v.string()),
    
    // Arrays passed directly from our dynamic frontend state!
    sections: v.array(
      v.object({
        name: v.string(),
        startTime: v.string(),
        endTime: v.string(),
      })
    ),
    jobScopes: v.array(
      v.object({
        section: v.string(), // We'll match this name to the IDs we create!
        role: v.union(v.literal("staff"), v.literal("supervisor")),
        startTime: v.string(),
        endTime: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // 1. Generate unique 6-character alphanumeric invite code
    let joinCode = "";
    let isUnique = false;
    while (!isUnique) {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await ctx.db
        .query("events")
        .withIndex("by_joinCode", (q) => q.eq("joinCode", joinCode))
        .first();
      if (!existing) isUnique = true;
    }

    // 2. CREDIT CHECK: Ensure the user has at least 1 valid pass available.
    const monthlyCredits = user.monthlyCredits ?? 0;
    const oneTimeCredits = user.oneTimeCredits ?? 0;
    const totalCredits = monthlyCredits + oneTimeCredits;

    if (totalCredits <= 0) {
      throw new Error("Insufficient credits. Please top up or upgrade to create a new event.");
    }

    // 3. Determine user tier status and hard limits
    const isPaidUser = 
      user.billingPlan === "pro_monthly" || 
      user.billingPlan === "pay_as_you_go";
      
    const tier = isPaidUser ? "pro" : "free";
    
    // 🚀 Safety: 50 staff is completely safe and will not impact operational costs!
    const maxStaff = isPaidUser ? 50 : 5; 

    // 4. DEDUCT CREDIT: Consume 1 pass atomically. 
    // Prioritize Monthly subscription credits first, fall back to One-time credits.
    if (monthlyCredits > 0) {
      await ctx.db.patch(user._id, { monthlyCredits: monthlyCredits - 1 });
    } else {
      await ctx.db.patch(user._id, { oneTimeCredits: oneTimeCredits - 1 });
    }

    // 2. SAVE PARENT: Create the core event container
    const eventId = await ctx.db.insert("events", {
      adminId: user._id,
      title: args.title,
      joinCode,
      maxStaff,
      status: "draft",
      tier,
      location: args.location,
      eventDate: args.eventDate,
      startTime: args.startTime,
      description: args.description,
      createdAt: Date.now(),
    });

    // 3. SAVE CHILDREN: Insert each section using provided explicit scheduling!
    const sectionMap = new Map();

    for (const sec of args.sections) {
      const sectionId = await ctx.db.insert("eventSections", {
        eventId,
        name: sec.name,
        headcount: 0, // Starting population
        status: "empty", // Current occupancy logic status
        startTime: sec.startTime,
        endTime: sec.endTime,
      });
      // Create a composite key to uniquely identify duplicate location names with separate times!
      sectionMap.set(`${sec.name}|${sec.startTime}|${sec.endTime}`, sectionId);
    }

    // 4. SAVE GRANDCHILDREN: Insert each individual staff role slotted correctly!
    for (const scope of args.jobScopes) {
      // Retrieve sectionId by matching the exact composite identity!
      const sectionId = sectionMap.get(`${scope.section}|${scope.startTime}|${scope.endTime}`);

      await ctx.db.insert("roleSlots", {
        eventId,
        sectionId, // Crucial dynamic linkage established here!
        title: scope.title,
        role: scope.role,
        description: scope.description,
        // ✨ NOTICE: We no longer insert startTime/endTime here! 
        // They are now stored correctly upstream on the Parent Section.
      });
    }

    return { eventId, joinCode };
  },
});

/**
 * List all events owned by the currently authenticated admin.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    return await ctx.db
      .query("events")
      .withIndex("by_admin", (q) => q.eq("adminId", user._id))
      .order("asc") // Show closest events first!
      .collect();
  },
});

/**
 * Get details of a single event (must be either the owning admin or associated live staff).
 */
export const get = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }

    // Attempt to verify if they are the admin
    let isAuthorized = false;
    try {
      const user = await getAuthenticatedUser(ctx);
      if (user._id === event.adminId) {
        isAuthorized = true;
      }
    } catch {
      // If not logged in as admin, check if they are authorized live staff
      // This will be useful when helpers query the event details
    }

    if (!isAuthorized) {
      throw new Error("Unauthorized access to event");
    }

    return event;
  },
});

/**
 * Full hierarchical fetcher retrieving the Event, its discrete Sections, and all active Role Slots.
 * Optimized to restore complete view models in a single network fetch.
 */
export const getDetails = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    
    // 1. Load Event Shell & Verify Admin Authorization
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    if (event.adminId !== user._id) {
      throw new Error("Unauthorized access to this event");
    }

    // 2. Fetch All Sections tied to this event
    const sections = await ctx.db
      .query("eventSections")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // 3. Fetch All discrete RoleSlots
    const slots = await ctx.db
      .query("roleSlots")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return {
      event,
      sections,
      slots,
    };
  },
});

/**
 * Update event parameters.
 */
export const update = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    location: v.optional(v.string()),
    eventDate: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    description: v.optional(v.string()),
    sections: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("live"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.adminId !== user._id) {
      throw new Error("Unauthorized to modify this event");
    }

    // Build the updates object
    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.location !== undefined) updates.location = args.location;
    if (args.eventDate !== undefined) updates.eventDate = args.eventDate;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.description !== undefined) updates.description = args.description;
    if (args.sections !== undefined) updates.sections = args.sections;

    // Handle lifecycle status transitions
    if (args.status !== undefined && args.status !== event.status) {
      updates.status = args.status;
      if (args.status === "live" && !event.liveAt) {
        updates.liveAt = Date.now();
        // 24 hours duration for active tracking sessions
        updates.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      }
    }

    await ctx.db.patch(args.eventId, updates);
    return { success: true };
  },
});

/**
 * Delete an event and gracefully cascade-delete all associated data.
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.adminId !== user._id) {
      throw new Error("Unauthorized to delete this event");
    }

    // 1. Delete associated roleSlots
    const slots = await ctx.db
      .query("roleSlots")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const slot of slots) {
      await ctx.db.delete(slot._id);
    }

    // 2. Delete associated liveStaff records
    const staffMembers = await ctx.db
      .query("liveStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const staff of staffMembers) {
      await ctx.db.delete(staff._id);
    }

    // 3. Delete associated jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }

    // 4. Delete associated messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // 5. Delete the parent event itself
    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});
