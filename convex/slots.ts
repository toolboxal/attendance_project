import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Helper to get currently authenticated admin user.
 */
async function getAuthenticatedUser(ctx: any) {
  const authUser = await authComponent.getAuthUser(ctx);
  if (!authUser) {
    throw new Error("Unauthorized");
  }
  const userId = authUser._id || authUser.id;
  const user = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", userId))
    .first();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Create a new Role Slot for an event, generating an ephemeral invite token.
 */
export const createSlot = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    role: v.union(v.literal("usher"), v.literal("attendant"), v.literal("supervisor")),
    section: v.optional(v.string()),

    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }
    if (event.adminId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Generate secure random ephemeral invite token
    const randomPart1 = Math.random().toString(36).substring(2, 12);
    const randomPart2 = Math.random().toString(36).substring(2, 12);
    const inviteToken = `t_${randomPart1}${randomPart2}`;
    
    // Default invite link validity: 7 days or until event starts (whichever is earlier)
    const inviteTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const slotId = await ctx.db.insert("roleSlots", {
      eventId: args.eventId,
      title: args.title,
      role: args.role,
      section: args.section,
      description: args.description,
      inviteToken,
      inviteTokenExpiresAt,
    });

    return { slotId, inviteToken };
  },
});

/**
 * List all role slots for an event.
 */
export const listSlots = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roleSlots")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Update role slot parameters or regenerate invite token.
 */
export const updateSlot = mutation({
  args: {
    slotId: v.id("roleSlots"),
    title: v.optional(v.string()),
    role: v.optional(v.union(v.literal("usher"), v.literal("attendant"), v.literal("supervisor"))),
    section: v.optional(v.string()),
    description: v.optional(v.string()),
    regenerateToken: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const slot = await ctx.db.get(args.slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    const event = await ctx.db.get(slot.eventId);
    if (!event || event.adminId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.role !== undefined) updates.role = args.role;
    if (args.section !== undefined) updates.section = args.section;
    if (args.description !== undefined) updates.description = args.description;

    if (args.regenerateToken) {
      const randomPart1 = Math.random().toString(36).substring(2, 12);
      const randomPart2 = Math.random().toString(36).substring(2, 12);
      updates.inviteToken = `t_${randomPart1}${randomPart2}`;
      updates.inviteTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    await ctx.db.patch(args.slotId, updates);
    return { success: true, inviteToken: updates.inviteToken };
  },
});

/**
 * Delete a role slot.
 */
export const deleteSlot = mutation({
  args: {
    slotId: v.id("roleSlots"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const slot = await ctx.db.get(args.slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    const event = await ctx.db.get(slot.eventId);
    if (!event || event.adminId !== user._id) {
      throw new Error("Unauthorized");
    }

    // If there is an active staff assigned, we can check them out or delete their session
    if (slot.assignedStaffId) {
      await ctx.db.delete(slot.assignedStaffId);
    }

    await ctx.db.delete(args.slotId);
    return { success: true };
  },
});

/**
 * Claim a role slot via an ephemeral invite token (Public Helper Onboarding).
 * Automatically consumes the token, registers the liveStaff member, and logs them in.
 */
export const claimSlot = mutation({
  args: {
    inviteToken: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find the slot by the unique invite token
    const slot = await ctx.db
      .query("roleSlots")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
      .first();

    if (!slot) {
      throw new Error("This invite link is invalid or has already been used");
    }

    // 2. Validate token expiration
    if (slot.inviteTokenExpiresAt && Date.now() > slot.inviteTokenExpiresAt) {
      throw new Error("This invite link has expired");
    }

    // 3. Ensure the slot is still vacant
    if (slot.assignedStaffId) {
      throw new Error("This slot has already been claimed by another helper");
    }

    // 4. Create secure localStorage token for helper session
    const helperSessionToken = `hs_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // 5. Insert new ephemeral liveStaff record
    const staffId = await ctx.db.insert("liveStaff", {
      eventId: slot.eventId,
      name: args.name,
      role: slot.role,
      section: slot.section,
      token: helperSessionToken,
      lastActive: Date.now(),
      status: "active",
      createdAt: Date.now(),
    });

    // 6. Assign the staff member to the slot and CONSUME/CLEAR the invite token
    await ctx.db.patch(slot._id, {
      assignedStaffId: staffId,
      inviteToken: undefined, // Cleared so it cannot be reused
      inviteTokenExpiresAt: undefined,
    });

    return {
      success: true,
      eventId: slot.eventId,
      token: helperSessionToken,
      role: slot.role,
      title: slot.title,
    };
  },
});

/**
 * Check out a staff member (manually by Admin or when shift ends).
 * Invalidates their session and frees up the slot for a new shift.
 */
export const checkOutStaff = mutation({
  args: {
    slotId: v.id("roleSlots"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const slot = await ctx.db.get(args.slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    const event = await ctx.db.get(slot.eventId);
    if (!event || event.adminId !== user._id) {
      throw new Error("Unauthorized");
    }

    if (!slot.assignedStaffId) {
      return { success: true, message: "Slot was already vacant" };
    }

    // 1. Mark the liveStaff member as checked out
    await ctx.db.patch(slot.assignedStaffId, {
      status: "checked_out",
      lastActive: Date.now(),
    });

    // 2. Vacate the slot so it can be assigned to a new shift
    await ctx.db.patch(slot._id, {
      assignedStaffId: undefined,
    });

    return { success: true };
  },
});
