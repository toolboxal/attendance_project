import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	MAX_WATCHLIST_ENTRIES,
	MAX_WATCHLIST_LABEL_LENGTH,
	MAX_WATCHLIST_NOTES_LENGTH,
	MAX_WATCHLIST_UPDATE_LENGTH,
	WATCHLIST_KINDS,
	type WatchlistKind,
} from "./constants";
import { getAuthenticatedUser } from "./events";
import { getLiveContext } from "./liveAuth";

async function enrichLiveStaffInline(
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
		return {
			name: staffDoc.staffName,
			role: staffDoc.role,
			roleTitle: "Event Admin",
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

function createStaffCacheInline(ctx: QueryCtx) {
	const cache = new Map<
		Id<"liveStaff">,
		Awaited<ReturnType<typeof enrichLiveStaffInline>>
	>();

	return async (staffId: Id<"liveStaff">) => {
		const cached = cache.get(staffId);
		if (cached) return cached;
		const staffDoc = await ctx.db.get(staffId);
		const enriched = await enrichLiveStaffInline(ctx, staffDoc);
		cache.set(staffId, enriched);
		return enriched;
	};
}

async function assertEventOwner(
	ctx: QueryCtx | MutationCtx,
	eventId: Id<"events">,
) {
	const user = await getAuthenticatedUser(ctx);
	const event = await ctx.db.get(eventId);
	if (!event) {
		throw new Error("Event not found.");
	}
	if (event.adminId !== user._id) {
		throw new Error("Unauthorized access to this event.");
	}
	return { user, event };
}

function isWatchlistKind(value: string): value is WatchlistKind {
	return (WATCHLIST_KINDS as readonly string[]).includes(value);
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

function validateLabel(label: string): string {
	const trimmed = label.trim();
	if (trimmed.length < 1) {
		throw new Error("Label is required.");
	}
	if (trimmed.length > MAX_WATCHLIST_LABEL_LENGTH) {
		throw new Error(
			`Label must be at most ${MAX_WATCHLIST_LABEL_LENGTH} characters.`,
		);
	}
	return trimmed;
}

function validateNotes(notes: string | undefined): string | undefined {
	if (notes === undefined) return undefined;
	const trimmed = notes.trim();
	if (trimmed.length === 0) return undefined;
	if (trimmed.length > MAX_WATCHLIST_NOTES_LENGTH) {
		throw new Error(
			`Notes must be at most ${MAX_WATCHLIST_NOTES_LENGTH} characters.`,
		);
	}
	return trimmed;
}

function validateUpdateContent(content: string): string {
	const trimmed = content.trim();
	if (trimmed.length < 1) {
		throw new Error("Message cannot be empty.");
	}
	if (trimmed.length > MAX_WATCHLIST_UPDATE_LENGTH) {
		throw new Error(
			`Message must be at most ${MAX_WATCHLIST_UPDATE_LENGTH} characters.`,
		);
	}
	return trimmed;
}

async function getActiveEntriesForEvent(
	ctx: QueryCtx,
	eventId: Id<"events">,
) {
	const entries = await ctx.db
		.query("eventWatchlist")
		.withIndex("by_event", (q) => q.eq("eventId", eventId))
		.collect();

	return entries
		.filter((e) => e.status === "active")
		.sort((a, b) => b._creationTime - a._creationTime);
}

async function enrichEntry(
	ctx: QueryCtx,
	entry: Doc<"eventWatchlist">,
	getStaff?: ReturnType<typeof createStaffCacheInline>,
) {
	const photoUrl = entry.photoId
		? await ctx.storage.getUrl(entry.photoId)
		: null;

	const rawUpdates = await ctx.db
		.query("watchlistUpdates")
		.withIndex("by_entry", (q) => q.eq("watchlistEntryId", entry._id))
		.order("asc")
		.collect();

	const updateCount = rawUpdates.length;
	const latestRaw =
		rawUpdates.length > 0 ? rawUpdates[rawUpdates.length - 1] : null;

	let latestUpdate = null;
	if (latestRaw && getStaff) {
		const author = await getStaff(latestRaw.authorId);
		latestUpdate = {
			_id: latestRaw._id,
			content: latestRaw.content,
			createdAt: latestRaw._creationTime,
			authorName: author.name,
			authorRole: author.role,
		};
	}

	return {
		...entry,
		createdAt: entry._creationTime,
		photoUrl,
		updateCount,
		latestUpdate,
	};
}

export const listForEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		await assertEventOwner(ctx, args.eventId);
		const active = await getActiveEntriesForEvent(ctx, args.eventId);
		return await Promise.all(
			active.map((entry) => enrichEntry(ctx, entry)),
		);
	},
});

export const getActiveForLive = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return [];

		const active = await getActiveEntriesForEvent(ctx, live.staff.eventId);
		const getStaff = createStaffCacheInline(ctx);

		return await Promise.all(
			active.map((entry) => enrichEntry(ctx, entry, getStaff)),
		);
	},
});

export const getWatchlistUpdates = query({
	args: {
		accessToken: v.string(),
		watchlistEntryId: v.id("eventWatchlist"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return [];

		const entry = await ctx.db.get(args.watchlistEntryId);
		if (
			!entry ||
			entry.eventId !== live.staff.eventId ||
			entry.status !== "active"
		) {
			return [];
		}

		const getStaff = createStaffCacheInline(ctx);
		const rawUpdates = await ctx.db
			.query("watchlistUpdates")
			.withIndex("by_entry", (q) => q.eq("watchlistEntryId", entry._id))
			.order("asc")
			.collect();

		return await Promise.all(
			rawUpdates.map(async (update) => {
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
			}),
		);
	},
});

export const create = mutation({
	args: {
		eventId: v.id("events"),
		kind: v.string(),
		label: v.string(),
		notes: v.optional(v.string()),
		photoId: v.optional(v.id("_storage")),
	},
	handler: async (ctx, args) => {
		const { user } = await assertEventOwner(ctx, args.eventId);

		if (!isWatchlistKind(args.kind)) {
			throw new Error("Invalid watchlist entry type.");
		}

		const trimmedLabel = validateLabel(args.label);
		const trimmedNotes = validateNotes(args.notes);
		await verifyPhotoId(ctx, args.photoId);

		if (args.kind === "banned_person" && !args.photoId) {
			throw new Error("A photo is required for banned person entries.");
		}

		const active = await getActiveEntriesForEvent(ctx, args.eventId);
		if (active.length >= MAX_WATCHLIST_ENTRIES) {
			throw new Error(
				`Watchlist limit reached (max ${MAX_WATCHLIST_ENTRIES}). Remove an entry first.`,
			);
		}

		return await ctx.db.insert("eventWatchlist", {
			eventId: args.eventId,
			kind: args.kind,
			label: trimmedLabel,
			notes: trimmedNotes,
			photoId: args.photoId,
			status: "active",
			createdByAdminId: user._id,
		});
	},
});

export const remove = mutation({
	args: { entryId: v.id("eventWatchlist") },
	handler: async (ctx, args) => {
		const entry = await ctx.db.get(args.entryId);
		if (!entry) {
			throw new Error("Entry not found.");
		}

		const { user } = await assertEventOwner(ctx, entry.eventId);

		if (entry.status === "removed") {
			return;
		}

		await ctx.db.patch(args.entryId, {
			status: "removed",
			removedAt: Date.now(),
			removedByAdminId: user._id,
		});
	},
});

export const generateWatchlistPhotoUploadUrl = mutation({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		await assertEventOwner(ctx, args.eventId);
		return await ctx.storage.generateUploadUrl();
	},
});

export const addWatchlistUpdate = mutation({
	args: {
		accessToken: v.string(),
		watchlistEntryId: v.id("eventWatchlist"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const entry = await ctx.db.get(args.watchlistEntryId);
		if (!entry) throw new Error("Watchlist entry not found.");
		if (entry.eventId !== live.staff.eventId) {
			throw new Error("Watchlist entry not found.");
		}
		if (entry.status !== "active") {
			throw new Error("Cannot post updates to a removed entry.");
		}

		const trimmedContent = validateUpdateContent(args.content);

		return await ctx.db.insert("watchlistUpdates", {
			watchlistEntryId: entry._id,
			eventId: live.staff.eventId,
			authorId: live.staff._id,
			content: trimmedContent,
		});
	},
});
