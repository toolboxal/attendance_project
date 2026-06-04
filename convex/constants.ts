/** Max unresolved (pending + accepted) jobs per live event. */
export const MAX_ACTIVE_JOBS = 10;

/** Max open alerts per live event. */
export const MAX_ACTIVE_ALERTS = 10;

/** Max pinned open alerts per live event (supervisor/admin). */
export const MAX_PINNED_ALERTS = 3;

export const MAX_ALERT_BODY_LENGTH = 50;
export const MAX_ALERT_UPDATE_LENGTH = 50;

/** Max characters for optional job dispatch note. */
export const MAX_JOB_DESCRIPTION_LENGTH = 50;

/** Preset chips — same role as jobs `requestType` values. */
export const ALERT_TYPES = [
	"security",
	"medical",
	"crowded",
	"lost_person",
	"maintenance",
	"spill",
	"general",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

/** Max active watchlist entries per event. */
export const MAX_WATCHLIST_ENTRIES = 25;

export const WATCHLIST_KINDS = ["banned_person", "prohibited_item"] as const;
export type WatchlistKind = (typeof WATCHLIST_KINDS)[number];

export const MAX_WATCHLIST_LABEL_LENGTH = 80;
export const MAX_WATCHLIST_NOTES_LENGTH = 300;
export const MAX_WATCHLIST_UPDATE_LENGTH = MAX_ALERT_UPDATE_LENGTH;
