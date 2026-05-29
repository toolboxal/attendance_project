import type { Id } from "../../convex/_generated/dataModel";

const STORAGE_PREFIX = "asistir_alert_seen";

export type AlertReadMap = Record<string, number>;

function storageKey(eventId: Id<"events">) {
	return `${STORAGE_PREFIX}:${eventId}`;
}

function sanitizeMap(raw: unknown): AlertReadMap {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		return {};
	}
	const map: AlertReadMap = {};
	for (const [alertId, value] of Object.entries(raw)) {
		const n = Number(value);
		if (Number.isFinite(n) && n >= 0) {
			map[alertId] = n;
		}
	}
	return map;
}

export function getAlertReadMap(eventId: Id<"events">): AlertReadMap {
	try {
		const raw = localStorage.getItem(storageKey(eventId));
		if (!raw) return {};
		return sanitizeMap(JSON.parse(raw));
	} catch {
		return {};
	}
}

/** Updates one alert in the map and persists. Returns the full map. */
export function setLastSeenForAlert(
	eventId: Id<"events">,
	alertId: Id<"alerts">,
	updateCount: number,
): AlertReadMap {
	const map = getAlertReadMap(eventId);
	map[alertId] = Math.max(0, updateCount);
	try {
		localStorage.setItem(storageKey(eventId), JSON.stringify(map));
	} catch {
		// ignore quota / private mode
	}
	return map;
}

export function getUnreadUpdateCount(
	updateCount: number,
	alertId: Id<"alerts">,
	readMap: AlertReadMap,
): number {
	const lastSeen = readMap[alertId] ?? 0;
	return Math.max(0, updateCount - lastSeen);
}
