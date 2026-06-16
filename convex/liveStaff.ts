import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { getAuthenticatedUser, isEventAccessClosed } from "./events";
import { getLiveContext, requireAdmin } from "./liveAuth";
import { ConvexError } from "convex/values";

function generateAccessToken() {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

function generateInviteToken() {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function assignStaffToSlotInternal(
	ctx: MutationCtx,
	slotId: Id<"roleSlots">,
	staffName: string,
) {
	const trimmedName = staffName.trim();
	if (!trimmedName) throw new Error("Staff name cannot be empty.");

	const slot = await ctx.db.get(slotId);
	if (!slot) throw new Error("Role slot not found.");

	let liveStaffId = slot.assignedStaffId;
	const existingStaff = liveStaffId ? await ctx.db.get(liveStaffId) : null;

	if (!existingStaff) {
		const secureAccessToken = generateAccessToken();
		liveStaffId = await ctx.db.insert("liveStaff", {
			eventId: slot.eventId,
			staffName: trimmedName,
			role: slot.role,
			sectionId: slot.sectionId,
			accessToken: secureAccessToken,
			lastActive: Date.now(),
			status: "unclaimed",
		});
	} else {
		await ctx.db.patch(existingStaff._id, {
			staffName: trimmedName,
			lastActive: Date.now(),
		});
		liveStaffId = existingStaff._id;

		// Already claimed and on the floor — name-only update; do not restore invite token.
		if (existingStaff.status === "active") {
			return {
				staffId: liveStaffId,
				success: true as const,
			};
		}
	}

	let token = slot.inviteToken;
	if (!token) {
		token = generateInviteToken();
	}

	await ctx.db.patch(slotId, {
		assignedStaffId: liveStaffId,
		inviteToken: token,
	});

	return {
		inviteToken: token,
		staffId: liveStaffId,
		success: true as const,
	};
}

async function revokeStaffFromSlotInternal(
	ctx: MutationCtx,
	slotId: Id<"roleSlots">,
) {
	const slot = await ctx.db.get(slotId);
	if (!slot) {
		throw new ConvexError({
			title: "Slot Not Found",
			reason: "The requested role slot does not exist.",
			actionNeeded: "Please refresh and try again.",
			errorType: 404,
		});
	}

	if (slot.assignedStaffId) {
		const staff = await ctx.db.get(slot.assignedStaffId);
		if (staff?.adminUserId != null) {
			throw new ConvexError({
				title: "Cannot Revoke",
				reason: "Admin floor sessions cannot be revoked from this action.",
				actionNeeded: "Use the dashboard to manage your admin session.",
				errorType: 403,
			});
		}
		await ctx.db.delete(slot.assignedStaffId);
	}

	await ctx.db.patch(slotId, {
		assignedStaffId: undefined,
		inviteToken: undefined,
	});

	return { success: true as const };
}

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

		const slot = await ctx.db.get(args.slotId);
		if (!slot) throw new Error("Role slot not found.");

		const event = await ctx.db.get(slot.eventId);
		if (!event) throw new Error("Parent event not found.");

		if (event.adminId !== user._id) {
			throw new Error("Unauthorized to manage staffing for this event.");
		}

		return assignStaffToSlotInternal(ctx, args.slotId, trimmedName);
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

		if (!slot) {
			return {
				valid: false,
				errorType: 404,
				reason: "Invalid invite link",
				actionNeeded: "This link has already been claimed, has expired, or is typed incorrectly. Please request a new invite link from your event administrator.",
			};
		}

		const event = await ctx.db.get(slot.eventId);
		if (!event) {
			return {
				valid: false,
				errorType: 404,
				reason: "Event no longer exists",
				actionNeeded: "The event for this assignment has been deleted. Please contact your administrator if you believe this is an error.",
			};
		}

		// Load the specific shift/section details linked to this role slot
		const section = slot.sectionId ? await ctx.db.get(slot.sectionId) : null;

		const liveStaff = slot.assignedStaffId ? await ctx.db.get(slot.assignedStaffId) : null;

		return {
			valid: true,
			eventTitle: event.title,
			eventLocation: event.location,
			eventDate: event.eventDate,
			eventTime: event.startTime,
			eventDescription: event.description,
			sectionName: section?.name ?? "",
			sectionStartTime: section?.startTime ?? "",
			sectionEndTime: section?.endTime ?? "",
			roleTitle: slot.title,
			roleType: slot.role,
			assignedName: liveStaff?.staffName || "Team Member",
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

		if (!slot) {
			throw new ConvexError({
				title: "Invalid Invite",
				reason: "This invite link is invalid or has already been claimed.",
				actionNeeded: "Please request a new link from your administrator.",
				errorType: 404,
			});
		}

		if (!slot.assignedStaffId) {
			throw new ConvexError({
				title: "Assignment Missing",
				reason: "No assigned staff found for this slot.",
				actionNeeded: "Please contact your administrator.",
				errorType: 404,
			});
		}

		const staff = await ctx.db.get(slot.assignedStaffId);
		if (!staff) {
			throw new ConvexError({
				title: "Staff Record Missing",
				reason: "Your staff member record could not be found.",
				actionNeeded: "Please contact your administrator.",
				errorType: 404,
			});
		}

		const event = await ctx.db.get(slot.eventId);
		if (!event) throw new Error("Parent event not found.");

		// 🏰 Smart Domain Gate: Only allow helpers while the event is live and within its window
		if (event.status !== "live" || isEventAccessClosed(event)) {
			const concluded = isEventAccessClosed(event);
			return {
				success: false,
				errorType: concluded ? 410 : 403,
				reason: concluded ? "Event has concluded" : "Event is not yet live",
				actionNeeded: concluded
					? "This event has finished and the staff portal is now closed. Thank you for your help!"
					: "The administrator has not activated this event yet. Please wait for them to go live before attempting to check in.",
			};
		}

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
		return { success: true, accessToken: staff.accessToken };
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
		if (!slot) {
			throw new ConvexError({
				title: "Slot Not Found",
				reason: "The requested role slot does not exist.",
				actionNeeded: "Please refresh your dashboard and try again.",
				errorType: 404,
			});
		}

		const event = await ctx.db.get(slot.eventId);
		if (!event) {
			throw new ConvexError({
				title: "Event Not Found",
				reason: "The parent event for this assignment has been deleted.",
				actionNeeded: "Please contact your administrator.",
				errorType: 404,
			});
		}

		if (event.adminId !== user._id) {
			throw new ConvexError({
				title: "Unauthorized",
				reason: "You do not have permission to modify this assignment.",
				actionNeeded: "Please ensure you are logged in with the correct account.",
				errorType: 403,
			});
		}

		return revokeStaffFromSlotInternal(ctx, args.slotId);
	},
});

/**
 * Issues (or reuses) a live floor session for the event admin.
 * Idempotent: same accessToken across laptop/phone re-entry.
 */
export const enterLiveFloorAsAdmin = mutation({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new ConvexError({
				title: "Event Not Found",
				reason: "This event does not exist.",
				actionNeeded: "Please refresh and try again.",
				errorType: 404,
			});
		}

		if (event.adminId !== user._id) {
			throw new ConvexError({
				title: "Unauthorized",
				reason: "You do not have permission to enter this event's live floor.",
				actionNeeded: "Please sign in with the account that owns this event.",
				errorType: 403,
			});
		}

		if (event.status !== "live" || isEventAccessClosed(event)) {
			const concluded = isEventAccessClosed(event);
			throw new ConvexError({
				title: concluded ? "Event Concluded" : "Event Not Live",
				reason: concluded
					? "This event has finished and the live floor is closed."
					: "The event must be live before you can enter the floor.",
				actionNeeded: concluded
					? "Re-open or duplicate the event if you need access again."
					: 'Use "Go Live" from the event dashboard first.',
				errorType: concluded ? 410 : 403,
			});
		}

		const existing = await ctx.db
			.query("liveStaff")
			.withIndex("by_event_admin", (q) =>
				q.eq("eventId", args.eventId).eq("adminUserId", user._id),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				status: "active",
				lastActive: Date.now(),
			});
			return { accessToken: existing.accessToken };
		}

		const accessToken = generateAccessToken();
		await ctx.db.insert("liveStaff", {
			eventId: args.eventId,
			staffName: user.name ?? "Event Admin",
			role: "supervisor",
			adminUserId: user._id,
			accessToken,
			lastActive: Date.now(),
			status: "active",
		});

		return { accessToken };
	},
});

/**
 * Resolves the active staff member's profile using their secure access token.
 * This powers the dashboard's context (e.g. knowing who they are and where they are stationed).
 */
export const getProfile = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const staff = await ctx.db
			.query("liveStaff")
			.withIndex("by_accessToken", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!staff) return null;
		
		// Block access if they were manually removed or checked out
		if (staff.status === "checked_out") return null;

		// Load contextual data for the UI
		const event = await ctx.db.get(staff.eventId);
		if (!event || event.status !== "live" || isEventAccessClosed(event)) return null;

		const isAdmin = staff.adminUserId != null;
		const isSupervisor = staff.role === "supervisor" || isAdmin;

		const section = staff.sectionId ? await ctx.db.get(staff.sectionId) : null;
		const roleSlot = isAdmin
			? null
			: await ctx.db
					.query("roleSlots")
					.withIndex("by_assignedStaff", (q) =>
						q.eq("assignedStaffId", staff._id),
					)
					.first();

		return {
			_id: staff._id,
			eventId: staff.eventId,
			name: staff.staffName,
			role: isAdmin ? staff.role : roleSlot?.role ?? staff.role,
			roleTitle: isAdmin ? "Event Admin" : roleSlot?.title || "",
			status: staff.status,
			sectionId: staff.sectionId,
			sectionName: isAdmin
				? "Event Control"
				: section?.name || "Floating",
			sectionStartTime: section?.startTime || "",
			sectionEndTime: section?.endTime || "",
			eventDate: event?.eventDate || "",
			eventTime: event?.startTime || "",
			isAdmin,
			isSupervisor,
		};
	},
});

/**
 * Session gate for the live floor layout and /live/ended page.
 * Distinguishes active sessions from gracefully ended events vs invalid tokens.
 */
export const getLiveSessionStatus = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const staff = await ctx.db
			.query("liveStaff")
			.withIndex("by_accessToken", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!staff || staff.status === "checked_out") {
			return { status: "invalid" as const };
		}

		const event = await ctx.db.get(staff.eventId);
		if (!event) {
			return { status: "invalid" as const };
		}

		if (event.status !== "live" || isEventAccessClosed(event)) {
			return {
				status: "ended" as const,
				eventTitle: event.title,
				isAdmin: staff.adminUserId != null,
			};
		}

		return { status: "active" as const };
	},
});

/** Read-only command-center metrics for the Admin tab. */
export const getAdminSituationOverview = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return null;

		requireAdmin(live);

		const { event } = live;
		const eventId = event._id;

		const [sections, openAlerts, activeJobs, activeStaff] = await Promise.all([
			ctx.db
				.query("eventSections")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
			ctx.db
				.query("alerts")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.filter((q) => q.eq(q.field("status"), "open"))
				.collect(),
			ctx.db
				.query("jobs")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.filter((q) => q.neq(q.field("status"), "resolved"))
				.collect(),
			ctx.db
				.query("liveStaff")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.filter((q) => q.eq(q.field("status"), "active"))
				.collect(),
		]);

		const totalHeadcount = sections
			.filter((s) => s.includeInTotal)
			.reduce((sum, s) => sum + s.headcount, 0);

		return {
			totalHeadcount,
			openAlertsCount: openAlerts.length,
			activeJobsCount: activeJobs.length,
			activeStaffCount: activeStaff.length,
			expiresAt: event.expiresAt ?? null,
		};
	},
});

/** Archive the event from the live floor (admin only). */
export const endEventFromLiveFloor = mutation({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Invalid session");

		requireAdmin(live);

		await ctx.db.patch(live.event._id, { status: "archived" });

		return { success: true };
	},
});

/** Staff management data for the live-floor Admin tab (admin only). */
export const getLiveFloorStaffManagement = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return null;

		requireAdmin(live);

		const { event } = live;
		const eventId = event._id;

		const [sections, slots, allStaff] = await Promise.all([
			ctx.db
				.query("eventSections")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
			ctx.db
				.query("roleSlots")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
			ctx.db
				.query("liveStaff")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		]);

		const staffById = new Map(
			allStaff
				.filter((s) => s.adminUserId == null)
				.map((s) => [s._id, s] as const),
		);

		type SlotAssignmentStatus = "vacant" | "pending" | "active";

		const resolveStatus = (
			assignedStaffId: Id<"liveStaff"> | undefined,
			inviteToken: string | undefined,
		): SlotAssignmentStatus => {
			if (!assignedStaffId) return "vacant";
			const staff = staffById.get(assignedStaffId);
			if (!staff) return "vacant";
			if (staff.status === "active" && !inviteToken) return "active";
			return "pending";
		};

		const slotsBySectionKey = new Map<
			string,
			Array<{
				slotId: Id<"roleSlots">;
				title: string;
				role: "supervisor" | "staff";
				assignmentStatus: SlotAssignmentStatus;
				staffId?: Id<"liveStaff">;
				staffName?: string;
				lastActive?: number;
				inviteToken?: string;
			}>
		>();

		const addSlot = (
			sectionKey: string,
			entry: (typeof slotsBySectionKey extends Map<string, infer V> ? V : never)[number],
		) => {
			const list = slotsBySectionKey.get(sectionKey) ?? [];
			list.push(entry);
			slotsBySectionKey.set(sectionKey, list);
		};

		for (const slot of slots) {
			const staff = slot.assignedStaffId
				? staffById.get(slot.assignedStaffId)
				: undefined;
			const sectionKey = slot.sectionId ?? "__floating__";
			addSlot(sectionKey, {
				slotId: slot._id,
				title: slot.title,
				role: slot.role,
				assignmentStatus: resolveStatus(
					slot.assignedStaffId,
					slot.inviteToken,
				),
				staffId: staff?._id,
				staffName: staff?.staffName,
				lastActive: staff?.lastActive,
				inviteToken: slot.inviteToken,
			});
		}

		const groupedSections: Array<{
			sectionKey: string;
			name: string;
			startTime?: string;
			endTime?: string;
			slots: NonNullable<ReturnType<typeof slotsBySectionKey.get>>;
		}> = [];

		for (const section of sections.sort((a, b) => a.name.localeCompare(b.name))) {
			const sectionSlots = slotsBySectionKey.get(section._id);
			if (!sectionSlots?.length) continue;
			sectionSlots.sort((a, b) => a.title.localeCompare(b.title));
			groupedSections.push({
				sectionKey: section._id,
				name: section.name,
				startTime: section.startTime,
				endTime: section.endTime,
				slots: sectionSlots,
			});
		}

		const floatingSlots = slotsBySectionKey.get("__floating__");
		if (floatingSlots?.length) {
			floatingSlots.sort((a, b) => a.title.localeCompare(b.title));
			groupedSections.push({
				sectionKey: "__floating__",
				name: "Floating",
				slots: floatingSlots,
			});
		}

		return {
			sections: groupedSections,
		};
	},
});

/** Assign or rename staff on a slot from the live floor (admin only). */
export const createStaffInvitationFromLiveFloor = mutation({
	args: {
		accessToken: v.string(),
		slotId: v.id("roleSlots"),
		staffName: v.string(),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Invalid session");

		requireAdmin(live);

		const slot = await ctx.db.get(args.slotId);
		if (!slot || slot.eventId !== live.event._id) {
			throw new Error("Slot not found for this event");
		}

		return assignStaffToSlotInternal(ctx, args.slotId, args.staffName);
	},
});

/** Revoke staff access from the live floor (admin only). */
export const revokeStaffFromLiveFloor = mutation({
	args: {
		accessToken: v.string(),
		slotId: v.id("roleSlots"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Invalid session");

		requireAdmin(live);

		const slot = await ctx.db.get(args.slotId);
		if (!slot || slot.eventId !== live.event._id) {
			throw new Error("Slot not found for this event");
		}

		return revokeStaffFromSlotInternal(ctx, args.slotId);
	},
});
