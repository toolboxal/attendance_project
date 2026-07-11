import type { Id } from "../../convex/_generated/dataModel";

const STORAGE_PREFIX = "asistir_alert_seen";
const KNOWN_ALERTS_PREFIX = "asistir_alert_known";

export type AlertReadMap = Record<string, number>;

function storageKey(eventId: Id<"events">) {
	return `${STORAGE_PREFIX}:${eventId}`;
}

function knownAlertsKey(eventId: Id<"events">) {
	return `${KNOWN_ALERTS_PREFIX}:${eventId}`;
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

function sanitizeIdList(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

/** Alert ids the staff has already acknowledged as seen (for tab badge). */
export function getKnownAlertIds(eventId: Id<"events">): Set<string> {
	try {
		const raw = localStorage.getItem(knownAlertsKey(eventId));
		if (!raw) return new Set();
		return new Set(sanitizeIdList(JSON.parse(raw)));
	} catch {
		return new Set();
	}
}

/** Marks alert ids as known and persists. Returns the full set. */
export function markAlertsKnown(
	eventId: Id<"events">,
	alertIds: Iterable<string>,
): Set<string> {
	const known = getKnownAlertIds(eventId);
	for (const id of alertIds) {
		known.add(id);
	}
	try {
		localStorage.setItem(knownAlertsKey(eventId), JSON.stringify([...known]));
	} catch {
		// ignore quota / private mode
	}
	return known;
}

/** New open alerts not yet seen, excluding ones created by the current staff. */
export function countUnseenNewAlerts(
	alerts: ReadonlyArray<{ _id: string; creatorId: string }>,
	knownIds: Set<string>,
	currentStaffId: string | undefined,
): number {
	return alerts.filter(
		(alert) =>
			!knownIds.has(alert._id) &&
			(currentStaffId == null || alert.creatorId !== currentStaffId),
	).length;
}
