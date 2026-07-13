/** Keep in sync with convex/credits.ts MAX_ARCHIVED_EVENTS. */
export const MAX_ARCHIVED_EVENTS = 10;

/** Keep in sync with convex/credits.ts MAX_DRAFT_LIMIT / FREE_DRAFT_LIMIT. */
export const FREE_DRAFT_LIMIT = 1;
export const MAX_DRAFT_LIMIT = 5;

export function formatEventInventoryLine(draftLimit: number): string {
	return `${draftLimit} draft${draftLimit === 1 ? "" : "s"} · 1 live · ${MAX_ARCHIVED_EVENTS} past events`;
}
