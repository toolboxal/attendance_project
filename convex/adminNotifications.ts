import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { MAX_ACTIVE_ALERTS } from "./constants";
import { getAuthenticatedUser } from "./events";

type ReadState = Pick<Doc<"adminAlertReadState">, "lastSeenUpdateCount">;

function getAlertUnread(
	updateCount: number,
	readState: ReadState | null,
): { unseenAlert: boolean; unreadUpdates: number } {
	if (!readState) {
		return { unseenAlert: true, unreadUpdates: 0 };
	}
	return {
		unseenAlert: false,
		unreadUpdates: Math.max(0, updateCount - readState.lastSeenUpdateCount),
	};
}

function getAlertUnreadTotal(
	updateCount: number,
	readState: ReadState | null,
): number {
	const { unseenAlert, unreadUpdates } = getAlertUnread(updateCount, readState);
	return (unseenAlert ? 1 : 0) + unreadUpdates;
}

async function enrichLiveStaffName(
	ctx: QueryCtx | MutationCtx,
	staffId: Id<"liveStaff">,
): Promise<string> {
	const staff = await ctx.db.get(staffId);
	if (!staff) return "Unknown staff";
	if (staff.adminUserId) return staff.staffName || "Event Admin";
	return staff.staffName;
}

async function getAdminLiveEvent(ctx: QueryCtx | MutationCtx, adminId: Id<"users">) {
	return await ctx.db
		.query("events")
		.withIndex("by_admin", (q) => q.eq("adminId", adminId))
		.filter((q) => q.eq(q.field("status"), "live"))
		.first();
}

async function loadReadStateMap(
	ctx: QueryCtx | MutationCtx,
	adminId: Id<"users">,
	eventId: Id<"events">,
) {
	const rows = await ctx.db
		.query("adminAlertReadState")
		.withIndex("by_admin_event", (q) =>
			q.eq("adminId", adminId).eq("eventId", eventId),
		)
		.collect();

	return new Map(rows.map((row) => [row.alertId, row]));
}

async function upsertAlertReadState(
	ctx: MutationCtx,
	adminId: Id<"users">,
	alertId: Id<"alerts">,
	eventId: Id<"events">,
	lastSeenUpdateCount: number,
) {
	const existing = await ctx.db
		.query("adminAlertReadState")
		.withIndex("by_admin_alert", (q) =>
			q.eq("adminId", adminId).eq("alertId", alertId),
		)
		.first();

	const updatedAt = Date.now();
	if (existing) {
		await ctx.db.patch(existing._id, { lastSeenUpdateCount, updatedAt });
		return;
	}

	await ctx.db.insert("adminAlertReadState", {
		adminId,
		alertId,
		eventId,
		lastSeenUpdateCount,
		updatedAt,
	});
}

export const getAdminAlertNotifications = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthenticatedUser(ctx);
		const liveEvent = await getAdminLiveEvent(ctx, user._id);

		if (!liveEvent) {
			return {
				eventId: null,
				eventTitle: null,
				unreadCount: 0,
				items: [] as Array<{
					alertId: Id<"alerts">;
					kind: "alert" | "alert_update";
					alertType: string;
					body: string;
					sectionName: string | null;
					creatorName: string;
					createdAt: number;
					unreadCount: number;
					isPinned: boolean;
				}>,
			};
		}

		const readStateMap = await loadReadStateMap(ctx, user._id, liveEvent._id);

		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_event", (q) => q.eq("eventId", liveEvent._id))
			.filter((q) => q.eq(q.field("status"), "open"))
			.order("desc")
			.take(MAX_ACTIVE_ALERTS);

		const items = await Promise.all(
			alerts.map(async (alert) => {
				const updates = await ctx.db
					.query("alertUpdates")
					.withIndex("by_alert", (q) => q.eq("alertId", alert._id))
					.order("asc")
					.collect();

				const updateCount = updates.length;
				const readState = readStateMap.get(alert._id) ?? null;
				const unread = getAlertUnread(updateCount, readState);
				const unreadCount = getAlertUnreadTotal(updateCount, readState);

				const latestUpdate =
					updates.length > 0 ? updates[updates.length - 1] : null;
				const section = alert.sectionId
					? await ctx.db.get(alert.sectionId)
					: null;
				const creatorName = await enrichLiveStaffName(ctx, alert.creatorId);

				const kind: "alert" | "alert_update" =
					unread.unseenAlert || !latestUpdate ? "alert" : "alert_update";
				const body =
					kind === "alert_update" && latestUpdate
						? latestUpdate.content
						: alert.body;
				const createdAt =
					kind === "alert_update" && latestUpdate
						? latestUpdate._creationTime
						: alert._creationTime;

				return {
					alertId: alert._id,
					kind,
					alertType: alert.alertType,
					body,
					sectionName: section?.name ?? null,
					creatorName,
					createdAt,
					unreadCount,
					isPinned: alert.isPinned,
				};
			}),
		);

		const unreadItems = items
			.filter((item) => item.unreadCount > 0)
			.sort((a, b) => {
				if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
				return b.createdAt - a.createdAt;
			});

		const unreadCount = unreadItems.reduce(
			(sum, item) => sum + item.unreadCount,
			0,
		);

		return {
			eventId: liveEvent._id,
			eventTitle: liveEvent.title,
			unreadCount,
			items: unreadItems,
		};
	},
});

export const markAdminAlertsSeen = mutation({
	args: {
		eventId: v.id("events"),
		alertIds: v.optional(v.array(v.id("alerts"))),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const event = await ctx.db.get(args.eventId);
		if (!event || event.adminId !== user._id) {
			throw new Error("Unauthorized");
		}

		let alertIds = args.alertIds;
		if (!alertIds) {
			const openAlerts = await ctx.db
				.query("alerts")
				.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
				.filter((q) => q.eq(q.field("status"), "open"))
				.collect();
			alertIds = openAlerts.map((alert) => alert._id);
		}

		for (const alertId of alertIds) {
			const alert = await ctx.db.get(alertId);
			if (!alert || alert.eventId !== args.eventId || alert.status !== "open") {
				continue;
			}

			const updates = await ctx.db
				.query("alertUpdates")
				.withIndex("by_alert", (q) => q.eq("alertId", alertId))
				.collect();

			await upsertAlertReadState(
				ctx,
				user._id,
				alertId,
				args.eventId,
				updates.length,
			);
		}

		return { success: true };
	},
});
