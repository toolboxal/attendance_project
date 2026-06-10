import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { authComponent } from "./auth";
import { ConvexError } from "convex/values";
import { DEFAULT_SECTION_LIVE_FIELDS } from "./sectionDefaults";

/**
 * Helper to get currently authenticated user from Better Auth and the database.
 */
export async function getAuthenticatedUser(ctx: any) {
  const authUser = await authComponent.getAuthUser(ctx);
  if (!authUser) {
    throw new ConvexError({
      title: "Authentication Required",
      reason: "No active session found.",
      actionNeeded: "Please sign in to access this resource.",
      errorType: 401,
    });
  }
  
  const userId = authUser._id || authUser.id;
  const user = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", userId))
    .first();

  if (!user) {
    throw new ConvexError({
      title: "User Not Found",
      reason: "Your user record could not be located in our database.",
      actionNeeded: "Please contact support if this issue persists.",
      errorType: 404,
    });
  }

  return user;
}

/** True when a live event's 24-hour window has elapsed. */
export function isLiveEventExpired(event: Pick<Doc<"events">, "status" | "expiresAt">) {
  return (
    event.status === "live" &&
    event.expiresAt != null &&
    Date.now() >= event.expiresAt
  );
}

/** Staff/admin access should be closed (archived or past expiresAt). */
export function isEventAccessClosed(event: Pick<Doc<"events">, "status" | "expiresAt">) {
  return event.status === "archived" || isLiveEventExpired(event);
}

function startOfUtcDayMs(timestampMs: number): number {
  const d = new Date(timestampMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function assertEventDateNotInPast(eventDate: number) {
  const eventDay = startOfUtcDayMs(eventDate);
  const today = startOfUtcDayMs(Date.now());
  if (eventDay < today) {
    throw new ConvexError({
      title: "Invalid Event Date",
      reason: "The event date cannot be in the past.",
      actionNeeded: "Choose today or a future date before saving.",
      errorType: 400,
    });
  }
}

async function archiveEventIfExpired(ctx: MutationCtx, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (!event || !isLiveEventExpired(event)) return false;
  await ctx.db.patch(eventId, { status: "archived" });
  return true;
}

/**
 * Scheduled at go-live (expiresAt): archives the event when its 24h window ends.
 * No-op if the admin already closed the event manually.
 */
export const archiveExpiredLiveEvents = internalMutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event || event.status !== "live") return;

    await ctx.db.patch(eventId, { status: "archived" });
  },
});

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
        id: v.optional(v.string()), // Matches frontend runtime format
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

    // 1. Draft Limit Guard: Enforce max 10 drafts at any time
    const existingDrafts = await ctx.db
      .query("events")
      .withIndex("by_admin", (q) => q.eq("adminId", user._id))
      .filter((q) => q.eq(q.field("status"), "draft"))
      .collect();

    if (existingDrafts.length >= 10) {
      throw new ConvexError({
        title: "Draft Limit Reached",
        reason: "You have reached the maximum limit of 10 draft events.",
        actionNeeded: "Please delete or activate an existing draft before creating a new one.",
        errorType: 403,
      });
    }

    assertEventDateNotInPast(args.eventDate);

    // 2. Generate unique 6-character alphanumeric invite code
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
    // 3. Determine user tier status and hard limits
    const isPaidUser = 
      user.billingPlan === "pro_monthly" || 
      user.billingPlan === "pay_as_you_go";
      
    const tier = isPaidUser ? "pro" : "free";
    
    // 🚀 Safety: 50 staff is completely safe and will not impact operational costs!
    const maxStaff = isPaidUser ? 50 : 5; 

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
    });

    // 3. SAVE CHILDREN: Normalize and insert each section using provided explicit scheduling
    const sanitizedSections = args.sections.map((sec) => ({
      ...sec,
      name: sec.name.trim().toLowerCase(),
    }));
    const sanitizedJobScopes = args.jobScopes.map((scope) => ({
      ...scope,
      section: scope.section.trim().toLowerCase(),
    }));

    const sectionMap = new Map();

    for (const sec of sanitizedSections) {
      const sectionId = await ctx.db.insert("eventSections", {
        eventId,
        name: sec.name,
        startTime: sec.startTime,
        endTime: sec.endTime,
        ...DEFAULT_SECTION_LIVE_FIELDS,
      });
      // Create a composite key to uniquely identify duplicate location names with separate times!
      sectionMap.set(`${sec.name}|${sec.startTime}|${sec.endTime}`, sectionId);
    }

    // 4. SAVE GRANDCHILDREN: Insert each individual staff role slotted correctly!
    for (const scope of sanitizedJobScopes) {
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

    // 1. Fetch active events (draft or live) - usually very few (hard-capped at 10 drafts & 1 live)
    const activeEvents = await ctx.db
      .query("events")
      .withIndex("by_admin", (q) => q.eq("adminId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "draft"),
          q.eq(q.field("status"), "live")
        )
      )
      .collect();

    // 2. Fetch only the 10 most recent archived events (sorted descending by date)
    const archivedEvents = await ctx.db
      .query("events")
      .withIndex("by_admin", (q) => q.eq("adminId", user._id))
      .filter((q) => q.eq(q.field("status"), "archived"))
      .order("desc")
      .take(10);

    // 3. Combine and sort: live → draft → archived, earliest eventDate first
    const statusOrder: Record<"live" | "draft" | "archived", number> = {
      live: 0,
      draft: 1,
      archived: 2,
    };
    const combined = [...activeEvents, ...archivedEvents];
    combined.sort((a, b) => {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      return a.eventDate - b.eventDate;
    });

    return combined;
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

    // 4. Fetch assigned ephemeral liveStaff (exclude admin floor sessions)
    const liveStaff = (
      await ctx.db
        .query("liveStaff")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect()
    ).filter((s) => s.adminUserId == null);

    return {
      event,
      sections,
      slots,
      liveStaff,
    };
  },
});

/**
 * Update event parameters.
 */
export const update = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    location: v.string(),
    eventDate: v.number(),
    startTime: v.string(),
    description: v.optional(v.string()),
    
    sections: v.array(
      v.object({
        name: v.string(),
        startTime: v.string(),
        endTime: v.string(),
      })
    ),
    jobScopes: v.array(
      v.object({
        id: v.optional(v.string()), // Maps to existing DB IDs to perform non-destructive sync!
        section: v.string(), 
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
    const event = await ctx.db.get(args.eventId);

    if (!event) throw new Error("Event not found");
    if (event.adminId !== user._id) {
      throw new Error("Unauthorized to modify this event");
    }

    assertEventDateNotInPast(args.eventDate);

    // 1. Update the core event container
    await ctx.db.patch(args.eventId, {
      title: args.title,
      location: args.location,
      eventDate: args.eventDate,
      startTime: args.startTime,
      description: args.description,
    });

    // Normalize incoming lists
    const sanitizedSections = args.sections.map((sec) => ({
      ...sec,
      name: sec.name.trim().toLowerCase(),
    }));
    const sanitizedJobScopes = args.jobScopes.map((scope) => ({
      ...scope,
      section: scope.section.trim().toLowerCase(),
    }));

    // 2. SYNC SECTIONS NON-DESTRUCTIVELY
    // Fetch all existing sections from the database
    const existingSections = await ctx.db
      .query("eventSections")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const sectionMap = new Map();
    const processedSectionIds = new Set();

    for (const sec of sanitizedSections) {
      // Match sections by their natural key (composite of name and shift time)
      const existing = existingSections.find(
        (s) =>
          s.name === sec.name &&
          s.startTime === sec.startTime &&
          s.endTime === sec.endTime
      );

      if (existing) {
        // Keep existing! Note down its ID for linkage and exclude from cleanup
        sectionMap.set(`${sec.name}|${sec.startTime}|${sec.endTime}`, existing._id);
        processedSectionIds.add(existing._id);
      } else {
        // New configuration! Insert section
        const sectionId = await ctx.db.insert("eventSections", {
          eventId: args.eventId,
          name: sec.name,
          startTime: sec.startTime,
          endTime: sec.endTime,
          ...DEFAULT_SECTION_LIVE_FIELDS,
        });
        sectionMap.set(`${sec.name}|${sec.startTime}|${sec.endTime}`, sectionId);
      }
    }

    // Gracefully remove any sections no longer active in the layout
    for (const sec of existingSections) {
      if (!processedSectionIds.has(sec._id)) {
        await ctx.db.delete(sec._id);
      }
    }

    // 3. SYNC ROLE SLOTS NON-DESTRUCTIVELY
    // Fetch all current role slots
    const existingSlots = await ctx.db
      .query("roleSlots")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const processedSlotIds = new Set();

    for (const scope of sanitizedJobScopes) {
      const sectionId = sectionMap.get(`${scope.section}|${scope.startTime}|${scope.endTime}`);

      // Validate if the incoming scope.id is an existing valid database row
      const existingMatch = scope.id
        ? existingSlots.find((slot) => slot._id === scope.id)
        : undefined;

      if (existingMatch) {
        // 🚀 CRUCIAL FIX: Update existing slot to protect assignments & active invitation tokens!
        await ctx.db.patch(existingMatch._id, {
          sectionId,
          title: scope.title,
          role: scope.role,
          description: scope.description,
        });
        processedSlotIds.add(existingMatch._id);
      } else {
        // Brand new role added by the admin! Create fresh slot
        await ctx.db.insert("roleSlots", {
          eventId: args.eventId,
          sectionId,
          title: scope.title,
          role: scope.role,
          description: scope.description,
        });
      }
    }

    // Prune old, removed slots
    for (const slot of existingSlots) {
      if (!processedSlotIds.has(slot._id)) {
        // Safety Guard: If the event is live, block deleting slots that have checked-in ushers!
        if (event.status === "live" && slot.assignedStaffId) {
          const staffUser = await ctx.db.get(slot.assignedStaffId);
          throw new Error(
            `Cannot delete role "${slot.title}" because ${staffUser?.staffName || "a helper"} is currently active and checked into it. Please unassign or check them out first.`
          );
        }
        await ctx.db.delete(slot._id);
      }
    }

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

    // 5. Delete associated eventSections
    const sections = await ctx.db
      .query("eventSections")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    for (const sec of sections) {
      await ctx.db.delete(sec._id);
    }

    // 6. Delete the parent event itself
    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});

/**
 * Update the status of an event (e.g. going live or archiving/concluding).
 */
export const updateStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(v.literal("draft"), v.literal("live"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) throw new Error("Event not found");
    if (event.adminId !== user._id) {
      throw new Error("Unauthorized to modify this event");
    }

    const updateFields: any = { status: args.status };

    if (args.status === "live") {
      assertEventDateNotInPast(event.eventDate);

      // 1. Concurrent Live Guard: Ensure the admin doesn't have another active live event
      const activeLiveEvent = await ctx.db
        .query("events")
        .withIndex("by_admin", (q) => q.eq("adminId", user._id))
        .filter((q) => q.eq(q.field("status"), "live"))
        .first();

      if (activeLiveEvent && activeLiveEvent._id !== event._id) {
        if (await archiveEventIfExpired(ctx, activeLiveEvent._id)) {
          // Stale live event past its 24h window — allow going live with the new one.
        } else {
          throw new Error(
            `You already have an active live event ("${activeLiveEvent.title}"). Please end it before going live with another one.`
          );
        }
      }

      // Deduct event pass credits ONLY when transitioning from draft to live
      if (event.status === "draft") {
        const monthlyCredits = user.monthlyCredits ?? 0;
        const oneTimeCredits = user.oneTimeCredits ?? 0;
        const totalCredits = monthlyCredits + oneTimeCredits;

        if (totalCredits <= 0) {
          throw new Error("Insufficient pass credits. Please top up or upgrade to go live.");
        }

        // Credit consumption priority:
        // 1. Expiring Monthly subscription credits (consume first)
        // 2. Lifetime One-time purchase credits (falls back next)
        if (monthlyCredits > 0) {
          await ctx.db.patch(user._id, { monthlyCredits: monthlyCredits - 1 });
        } else {
          await ctx.db.patch(user._id, { oneTimeCredits: oneTimeCredits - 1 });
        }
      }

      updateFields.liveAt = Date.now();
      // Set default expiration window of 24 hours
      updateFields.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    await ctx.db.patch(event._id, updateFields);

    if (args.status === "live" && updateFields.expiresAt) {
      await ctx.scheduler.runAt(
        updateFields.expiresAt,
        internal.events.archiveExpiredLiveEvents,
        { eventId: event._id },
      );
    }

    return { success: true };
  },
});

/**
 * Duplicate an event (cloning event parameters, sections, and role slots, while resetting assignments).
 */
export const duplicate = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const sourceEvent = await ctx.db.get(args.eventId);

    if (!sourceEvent) throw new Error("Source event not found");
    if (sourceEvent.adminId !== user._id) {
      throw new Error("Unauthorized to duplicate this event");
    }

    // 1. Enforce max 10 drafts cap!
    const existingDrafts = await ctx.db
      .query("events")
      .withIndex("by_admin", (q) => q.eq("adminId", user._id))
      .filter((q) => q.eq(q.field("status"), "draft"))
      .collect();

    if (existingDrafts.length >= 10) {
      throw new Error("You have reached the maximum limit of 10 draft events. Please delete or activate an existing draft first.");
    }

    // 2. Generate new unique joinCode
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

    // 3. Smart Title Generation: increment suffix instead of building ugly "(Copy) (Copy)" titles
    let newTitle = "";
    const copyRegex = /\(Copy\s*(\d*)\)$/;
    const match = sourceEvent.title.match(copyRegex);

    if (match) {
      const copyNum = match[1] ? parseInt(match[1], 10) : 1;
      newTitle = sourceEvent.title.replace(copyRegex, `(Copy ${copyNum + 1})`);
    } else {
      newTitle = `${sourceEvent.title} (Copy)`;
    }

    // 4. Clone the Event document (resets status to draft, liveAt/expiresAt to undefined)
    const newEventId = await ctx.db.insert("events", {
      adminId: user._id,
      title: newTitle,
      location: sourceEvent.location,
      eventDate: sourceEvent.eventDate,
      startTime: sourceEvent.startTime,
      description: sourceEvent.description,
      maxStaff: sourceEvent.maxStaff,
      joinCode,
      status: "draft",
      tier: sourceEvent.tier,
    });

    // 4. Clone all Sections and keep an ID mapping
    const sourceSections = await ctx.db
      .query("eventSections")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const sectionIdMap = new Map<string, Id<"eventSections">>();

    for (const sec of sourceSections) {
      const newSecId = await ctx.db.insert("eventSections", {
        eventId: newEventId,
        name: sec.name,
        startTime: sec.startTime,
        endTime: sec.endTime,
        ...DEFAULT_SECTION_LIVE_FIELDS,
      });
      sectionIdMap.set(sec._id, newSecId);
    }

    // 5. Clone all Role Slots (linking them to the new Section IDs and clearing assignments)
    const sourceSlots = await ctx.db
      .query("roleSlots")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const slot of sourceSlots) {
      const newSectionId = slot.sectionId 
        ? sectionIdMap.get(slot.sectionId) 
        : undefined;

      await ctx.db.insert("roleSlots", {
        eventId: newEventId,
        title: slot.title,
        role: slot.role,
        sectionId: newSectionId,
        description: slot.description,
        // Purge assigned staff and tokens!
        inviteToken: undefined,
        assignedStaffId: undefined,
      });
    }

    return { newEventId };
  },
});

