import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./events";

/**
 * Create or update a staff assignment and generate a secure invite token.
 * Called by Admin from the dashboard to pre-fill a name and get a shareable link.
 */
export const createStaffInvitation = mutation({
	args: {
		slotId: v.id("roleSlots"),
		staffName: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const trimmedName = args.staffName.trim();
		if (!trimmedName) throw new Error("Staff name cannot be empty.");

		// 1. Validate slot ownership
		const slot = await ctx.db.get(args.slotId);
		if (!slot) throw new Error("Role slot not found.");

		const event = await ctx.db.get(slot.eventId);
		if (!event) throw new Error("Parent event not found.");

		if (event.adminId !== user._id) {
			throw new Error("Unauthorized to manage staffing for this event.");
		}

		let liveStaffId = slot.assignedStaffId;

		// 2. CASE A: This slot is brand new/unclaimed. Create the pre-emptive record!
		if (!liveStaffId) {
			// Generate secure internal credential for persistent session storage later
			const secureAccessToken =
				Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15);

			liveStaffId = await ctx.db.insert("liveStaff", {
				eventId: slot.eventId,
				name: trimmedName,
				role: slot.role,
				sectionId: slot.sectionId, // Link physical duty location immediately!
				accessToken: secureAccessToken,
				lastActive: Date.now(),
				status: "unclaimed", // Start off as unclaimed until they open the link
			});
		} else {
			// CASE B: Already assigned. Admin is just renaming/updating the entry!
			await ctx.db.patch(liveStaffId, {
				name: trimmedName,
				lastActive: Date.now(),
			});
		}

		// 3. Generate/Retrieve Invite Token
		// If an inviteToken doesn't exist yet, generate one now!
		let token = slot.inviteToken;
		if (!token) {
			// Use safe alphanumeric string generator
			token =
				Math.random().toString(36).substring(2, 10) +
				Math.random().toString(36).substring(2, 10);
		}

		// 4. Seal the linkage
		await ctx.db.patch(args.slotId, {
			assignedStaffId: liveStaffId,
			inviteToken: token,
		});

		return {
			inviteToken: token,
			staffId: liveStaffId,
			success: true,
		};
	},
});

/**
 * Public route validator to let a helper "claim" their entry ticket via the link.
 */
export const validateInvite = query({
	args: { inviteToken: v.string() },
	handler: async (ctx, args) => {
		const slot = await ctx.db
			.query("roleSlots")
			.withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
			.first();

		if (!slot) return { valid: false, message: "Invalid invite link." };

		const event = await ctx.db.get(slot.eventId);
		if (!event) return { valid: false, message: "Event no longer exists." };

		// 🏰 Smart Domain Gate: Check if the event is already concluded/archived
		if (event.status === "archived") {
			return {
				valid: false,
				message: "This event has concluded and the invite portal is closed.",
			};
		}

		const liveStaff = slot.assignedStaffId ? await ctx.db.get(slot.assignedStaffId) : null;

		return {
			valid: true,
			eventTitle: event.title,
			eventLocation: event.location,
			eventDescription: event.description,
			roleTitle: slot.title,
			roleType: slot.role,
			assignedName: liveStaff?.name || "Team Member",
			// Passing access token ONLY here if desired, or handle in a protected claim mutation!
			// We will serve the public details for the UI first.
			accessToken: liveStaff?.accessToken ?? null,
		};
	},
});

/**
 * Security Engine: Claims the one-time ticket, destroys the inviteToken, and activates the staff member!
 */
export const claimStaffInvite = mutation({
	args: { inviteToken: v.string() },
	handler: async (ctx, args) => {
		const slot = await ctx.db
			.query("roleSlots")
			.withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
			.first();

		if (!slot) throw new Error("This invite link is invalid or has already been claimed.");

		if (!slot.assignedStaffId) throw new Error("No assigned staff found for this slot.");

		const staff = await ctx.db.get(slot.assignedStaffId);
		if (!staff) throw new Error("Staff member record not found.");

		// 1. 🚀 Activate the user profile
		await ctx.db.patch(staff._id, {
			status: "active",
			lastActive: Date.now(),
		});

		// 2. 🛡️ Destroy the ticket permanently so it cannot be reused!
		await ctx.db.patch(slot._id, {
			inviteToken: undefined,
		});

		// Return the permanent session key to store in localstorage
		return { accessToken: staff.accessToken };
	},
});

/**
 * Destroys the active staff assignment, deletes their live profile, and invalidates their access keycard.
 */
export const revokeStaffAccess = mutation({
	args: {
		slotId: v.id("roleSlots"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// 1. Load and authorize slot
		const slot = await ctx.db.get(args.slotId);
		if (!slot) throw new Error("Role slot not found.");

		const event = await ctx.db.get(slot.eventId);
		if (!event) throw new Error("Parent event not found.");

		if (event.adminId !== user._id) {
			throw new Error("Unauthorized to modify this assignment.");
		}

		// 2. Delete the actual liveStaff profile record if linked
		if (slot.assignedStaffId) {
			await ctx.db.delete(slot.assignedStaffId);
		}

		// 3. Wipe assignment link and invite token on the slot
		await ctx.db.patch(args.slotId, {
			assignedStaffId: undefined,
			inviteToken: undefined,
		});

		return { success: true };
	},
});
