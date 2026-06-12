import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { MAX_BROADCAST_LENGTH } from "./constants";
import { getLiveContext, requireAdmin } from "./liveAuth";

function validateBroadcastContent(content: string): string {
	const trimmed = content.trim();
	if (trimmed.length < 1) {
		throw new Error("Broadcast message cannot be empty.");
	}
	if (trimmed.length > MAX_BROADCAST_LENGTH) {
		throw new Error(
			`Broadcast message must be at most ${MAX_BROADCAST_LENGTH} characters.`,
		);
	}
	return trimmed;
}

async function demoteActiveBroadcasts(
	ctx: MutationCtx,
	eventId: Id<"events">,
) {
	const broadcasts = await ctx.db
		.query("broadcasts")
		.withIndex("by_event", (q) => q.eq("eventId", eventId))
		.collect();

	for (const broadcast of broadcasts) {
		if (broadcast.status === "active") {
			await ctx.db.patch(broadcast._id, { status: "inactive" });
		}
	}
}

export const getActiveBroadcast = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return null;

		const broadcasts = await ctx.db
			.query("broadcasts")
			.withIndex("by_event", (q) => q.eq("eventId", live.staff.eventId))
			.order("desc")
			.collect();

		const active = broadcasts.find((b) => b.status === "active");
		if (!active) return null;

		const creator = await ctx.db.get(active.createdByStaffId);

		return {
			_id: active._id,
			content: active.content,
			createdAt: active.createdAt,
			createdByName: creator?.staffName ?? "Event Admin",
		};
	},
});

export const getBroadcastHistory = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live || !live.isAdmin) return [];

		const broadcasts = await ctx.db
			.query("broadcasts")
			.withIndex("by_event", (q) => q.eq("eventId", live.staff.eventId))
			.order("desc")
			.collect();

		return broadcasts.map((broadcast) => ({
			_id: broadcast._id,
			content: broadcast.content,
			createdAt: broadcast.createdAt,
			status: broadcast.status,
		}));
	},
});

export const createBroadcast = mutation({
	args: {
		accessToken: v.string(),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Invalid session");

		requireAdmin(live);

		const content = validateBroadcastContent(args.content);

		await demoteActiveBroadcasts(ctx, live.staff.eventId);

		return await ctx.db.insert("broadcasts", {
			eventId: live.staff.eventId,
			content,
			createdByStaffId: live.staff._id,
			createdAt: Date.now(),
			status: "active",
		});
	},
});

export const deactivateBroadcast = mutation({
	args: {
		accessToken: v.string(),
		broadcastId: v.id("broadcasts"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Invalid session");

		requireAdmin(live);

		const broadcast = await ctx.db.get(args.broadcastId);
		if (!broadcast || broadcast.eventId !== live.staff.eventId) {
			throw new Error("Broadcast not found.");
		}

		if (broadcast.status === "inactive") return;

		await ctx.db.patch(args.broadcastId, { status: "inactive" });
	},
});

export const setActiveBroadcast = mutation({
	args: {
		accessToken: v.string(),
		broadcastId: v.id("broadcasts"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Invalid session");

		requireAdmin(live);

		const broadcast = await ctx.db.get(args.broadcastId);
		if (!broadcast || broadcast.eventId !== live.staff.eventId) {
			throw new Error("Broadcast not found.");
		}

		if (broadcast.status === "active") return;

		await demoteActiveBroadcasts(ctx, live.staff.eventId);
		await ctx.db.patch(args.broadcastId, { status: "active" });
	},
});

export const deleteBroadcast = mutation({
	args: {
		accessToken: v.string(),
		broadcastId: v.id("broadcasts"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Invalid session");

		requireAdmin(live);

		const broadcast = await ctx.db.get(args.broadcastId);
		if (!broadcast || broadcast.eventId !== live.staff.eventId) {
			throw new Error("Broadcast not found.");
		}

		await ctx.db.delete(args.broadcastId);
	},
});
