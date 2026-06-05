import type { Id } from "../../convex/_generated/dataModel";

const STORAGE_PREFIX = "asistir_watchlist_seen";

export type WatchlistReadMap = Record<string, number>;

function storageKey(eventId: Id<"events">) {
	return `${STORAGE_PREFIX}:${eventId}`;
}

function sanitizeMap(raw: unknown): WatchlistReadMap {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		return {};
	}
	const map: WatchlistReadMap = {};
	for (const [entryId, value] of Object.entries(raw)) {
		const n = Number(value);
		if (Number.isFinite(n) && n >= 0) {
			map[entryId] = n;
		}
	}
	return map;
}

export function getWatchlistReadMap(eventId: Id<"events">): WatchlistReadMap {
	try {
		const raw = localStorage.getItem(storageKey(eventId));
		if (!raw) return {};
		return sanitizeMap(JSON.parse(raw));
	} catch {
		return {};
	}
}

export function setLastSeenForWatchlistEntry(
	eventId: Id<"events">,
	entryId: Id<"eventWatchlist">,
	updateCount: number,
): WatchlistReadMap {
	const map = getWatchlistReadMap(eventId);
	map[entryId] = Math.max(0, updateCount);
	try {
		localStorage.setItem(storageKey(eventId), JSON.stringify(map));
	} catch {
		// ignore quota / private mode
	}
	return map;
}

export function getUnreadWatchlistUpdateCount(
	updateCount: number,
	entryId: Id<"eventWatchlist">,
	readMap: WatchlistReadMap,
): number {
	const lastSeen = readMap[entryId] ?? 0;
	return Math.max(0, updateCount - lastSeen);
}
