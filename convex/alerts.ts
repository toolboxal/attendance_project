import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	ALERT_TYPES,
	MAX_ACTIVE_ALERTS,
	MAX_ALERT_BODY_LENGTH,
	MAX_ALERT_UPDATE_LENGTH,
	MAX_PINNED_ALERTS,
} from "./constants";
import { getLiveContext, requireAdminOperationalPost, type LiveContext } from "./liveAuth";

function isAlertType(value: string): boolean {
	return (ALERT_TYPES as readonly string[]).includes(value);
}

function canResolveAlert(live: LiveContext, alert: Doc<"alerts">): boolean {
	return alert.creatorId === live.staff._id || live.isSupervisor;
}

function canPinAlert(live: LiveContext): boolean {
	return live.isSupervisor;
}

function validateAlertBody(body: string): string {
	const trimmed = body.trim();
	if (trimmed.length < 1) {
		throw new Error("Alert message cannot be empty.");
	}
	if (trimmed.length > MAX_ALERT_BODY_LENGTH) {
		throw new Error(
			`Alert message must be at most ${MAX_ALERT_BODY_LENGTH} characters.`,
		);
	}
	return trimmed;
}

function validateUpdateContent(content: string): string {
	const trimmed = content.trim();
	if (trimmed.length < 1) {
		throw new Error("Follow-up cannot be empty.");
	}
	if (trimmed.length > MAX_ALERT_UPDATE_LENGTH) {
		throw new Error(
			`Follow-up must be at most ${MAX_ALERT_UPDATE_LENGTH} characters.`,
		);
	}
	return trimmed;
}

async function enrichLiveStaff(
	ctx: QueryCtx | MutationCtx,
	staffDoc: Doc<"liveStaff"> | null,
) {
	if (!staffDoc) {
		return {
			name: "Unknown Staff",
			role: undefined as string | undefined,
			roleTitle: "",
		};
	}

	if (staffDoc.adminUserId) {
		const roleTitle = staffDoc.sectionId
			? staffDoc.operationalRoleTitle ?? "Covering post"
			: "Event Admin";
		return {
			name: staffDoc.staffName,
			role: "admin",
			roleTitle,
		};
	}

	const roleSlot = await ctx.db
		.query("roleSlots")
		.withIndex("by_assignedStaff", (q) =>
			q.eq("assignedStaffId", staffDoc._id),
		)
		.first();

	return {
		name: staffDoc.staffName,
		role: roleSlot?.role ?? staffDoc.role,
		roleTitle: roleSlot?.title ?? "",
	};
}

type EnrichedStaff = {
	name: string;
	role: string | undefined;
	roleTitle: string;
};

function createStaffCache(ctx: QueryCtx) {
	const cache = new Map<Id<"liveStaff">, EnrichedStaff>();

	return async (staffId: Id<"liveStaff">): Promise<EnrichedStaff> => {
		const cached = cache.get(staffId);
		if (cached) return cached;

		const staffDoc = await ctx.db.get(staffId);
		const enriched = await enrichLiveStaff(ctx, staffDoc);
		cache.set(staffId, enriched);
		return enriched;
	};
}

type EnrichedAlertUpdate = {
	_id: Id<"alertUpdates">;
	authorId: Id<"liveStaff">;
	content: string;
	createdAt: number;
	authorName: string;
	authorRole: string | undefined;
	authorRoleTitle: string;
};

async function enrichAlertUpdate(
	getStaff: (staffId: Id<"liveStaff">) => Promise<EnrichedStaff>,
	update: Doc<"alertUpdates">,
): Promise<EnrichedAlertUpdate> {
	const author = await getStaff(update.authorId);
	return {
		_id: update._id,
		authorId: update.authorId,
		content: update.content,
		createdAt: update._creationTime,
		authorName: author.name,
		authorRole: author.role,
		authorRoleTitle: author.roleTitle,
	};
}

async function verifyPhotoId(
	ctx: MutationCtx,
	photoId: Id<"_storage"> | undefined,
) {
	if (!photoId) return;
	const metadata = await ctx.db.system.get("_storage", photoId);
	if (!metadata) {
		throw new Error("Photo not found.");
	}
}

export const getActiveAlerts = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return [];

		const { staff } = live;

		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.filter((q) => q.eq(q.field("status"), "open"))
			.order("desc")
			.take(MAX_ACTIVE_ALERTS);

		const getStaff = createStaffCache(ctx);

		const enrichedAlerts = await Promise.all(
			alerts.map(async (alert) => {
				const creatorInfo = await getStaff(alert.creatorId);
				const pinnedByInfo = alert.pinnedById
					? await getStaff(alert.pinnedById)
					: null;

				const section = alert.sectionId
					? await ctx.db.get(alert.sectionId)
					: null;

				const photoUrl = alert.photoId
					? await ctx.storage.getUrl(alert.photoId)
					: null;

				const rawUpdates = await ctx.db
					.query("alertUpdates")
					.withIndex("by_alert", (q) => q.eq("alertId", alert._id))
					.order("asc")
					.collect();

				const updateCount = rawUpdates.length;
				const latestRaw =
					rawUpdates.length > 0
						? rawUpdates[rawUpdates.length - 1]
						: null;
				const latestUpdate = latestRaw
					? await enrichAlertUpdate(getStaff, latestRaw)
					: null;

				return {
					...alert,
					createdAt: alert._creationTime,
					creatorName: creatorInfo.name,
					creatorRole: creatorInfo.role,
					creatorRoleTitle: creatorInfo.roleTitle,
					sectionName: section?.name,
					pinnedByName: pinnedByInfo?.name,
					photoUrl,
					updateCount,
					latestUpdate,
					canResolve: canResolveAlert(live, alert),
					canPin: canPinAlert(live),
				};
			}),
		);

		enrichedAlerts.sort((a, b) => {
			if (a.isPinned !== b.isPinned) {
				return a.isPinned ? -1 : 1;
			}
			if (a.isPinned && b.isPinned) {
				return (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0);
			}
			return b._creationTime - a._creationTime;
		});

		return enrichedAlerts;
	},
});

export const getAlertUpdates = query({
	args: {
		accessToken: v.string(),
		alertId: v.id("alerts"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return [];

		const alert = await ctx.db.get(args.alertId);
		if (!alert || alert.eventId !== live.staff.eventId) {
			return [];
		}
		if (alert.status !== "open") {
			return [];
		}

		const getStaff = createStaffCache(ctx);

		const rawUpdates = await ctx.db
			.query("alertUpdates")
			.withIndex("by_alert", (q) => q.eq("alertId", alert._id))
			.order("asc")
			.collect();

		return await Promise.all(
			rawUpdates.map((update) => enrichAlertUpdate(getStaff, update)),
		);
	},
});

export const createAlert = mutation({
	args: {
		accessToken: v.string(),
		alertType: v.string(),
		body: v.string(),
		photoId: v.optional(v.id("_storage")),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		requireAdminOperationalPost(live);

		const { staff } = live;

		if (!isAlertType(args.alertType)) {
			throw new Error("Invalid alert type.");
		}

		const trimmedBody = validateAlertBody(args.body);
		await verifyPhotoId(ctx, args.photoId);

		const openAlerts = await ctx.db
			.query("alerts")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.filter((q) => q.eq(q.field("status"), "open"))
			.collect();

		if (openAlerts.length >= MAX_ACTIVE_ALERTS) {
			throw new Error(
				`Active alert limit reached (max ${MAX_ACTIVE_ALERTS}). Please wait for current alerts to be resolved.`,
			);
		}

		return await ctx.db.insert("alerts", {
			eventId: staff.eventId,
			creatorId: staff._id,
			sectionId: staff.sectionId,
			alertType: args.alertType,
			body: trimmedBody,
			photoId: args.photoId,
			isPinned: false,
			status: "open",
		});
	},
});

export const addAlertUpdate = mutation({
	args: {
		accessToken: v.string(),
		alertId: v.id("alerts"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const { staff } = live;

		const alert = await ctx.db.get(args.alertId);
		if (!alert) throw new Error("Alert not found.");
		if (alert.eventId !== staff.eventId) {
			throw new Error("Alert not found.");
		}
		if (alert.status !== "open") {
			throw new Error("Cannot add follow-ups to a resolved alert.");
		}

		const trimmedContent = validateUpdateContent(args.content);

		return await ctx.db.insert("alertUpdates", {
			alertId: alert._id,
			eventId: staff.eventId,
			authorId: staff._id,
			content: trimmedContent,
		});
	},
});

export const resolveAlert = mutation({
	args: {
		accessToken: v.string(),
		alertId: v.id("alerts"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const { staff } = live;

		const alert = await ctx.db.get(args.alertId);
		if (!alert) throw new Error("Alert not found.");
		if (alert.eventId !== staff.eventId) {
			throw new Error("Alert not found.");
		}
		if (alert.status !== "open") {
			throw new Error("Alert is already resolved.");
		}
		if (!canResolveAlert(live, alert)) {
			throw new Error("You are not authorized to resolve this alert.");
		}

		await ctx.db.patch(args.alertId, {
			status: "resolved",
			resolvedAt: Date.now(),
			resolvedById: staff._id,
		});
	},
});

export const setAlertPinned = mutation({
	args: {
		accessToken: v.string(),
		alertId: v.id("alerts"),
		pinned: v.boolean(),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		if (!canPinAlert(live)) {
			throw new Error("Only supervisors can pin alerts.");
		}

		const { staff } = live;

		const alert = await ctx.db.get(args.alertId);
		if (!alert) throw new Error("Alert not found.");
		if (alert.eventId !== staff.eventId) {
			throw new Error("Alert not found.");
		}
		if (alert.status !== "open") {
			throw new Error("Cannot pin a resolved alert.");
		}

		if (args.pinned && !alert.isPinned) {
			const openAlerts = await ctx.db
				.query("alerts")
				.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
				.filter((q) => q.eq(q.field("status"), "open"))
				.collect();

			const pinnedCount = openAlerts.filter((a) => a.isPinned).length;
			if (pinnedCount >= MAX_PINNED_ALERTS) {
				throw new Error(
					`Pin limit reached (max ${MAX_PINNED_ALERTS}). Unpin an alert first.`,
				);
			}
		}

		if (args.pinned) {
			await ctx.db.patch(args.alertId, {
				isPinned: true,
				pinnedAt: Date.now(),
				pinnedById: staff._id,
			});
		} else {
			await ctx.db.patch(args.alertId, {
				isPinned: false,
				pinnedAt: undefined,
				pinnedById: undefined,
			});
		}
	},
});

export const generateAlertPhotoUploadUrl = mutation({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		return await ctx.storage.generateUploadUrl();
	},
});
