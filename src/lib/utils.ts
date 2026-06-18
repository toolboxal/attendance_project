import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Deterministic 24h → 12h formatting (no Date()/timezone — safe for SSR).
export function formatTime12h(timeStr: string) {
	if (!timeStr) return "";
	const cleanTime = timeStr.substring(0, 5);
	const match = /^(\d{1,2}):(\d{2})$/.exec(cleanTime);
	if (!match) return timeStr;

	const hours = Number.parseInt(match[1], 10);
	const minutes = Number.parseInt(match[2], 10);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return timeStr;

	const period = hours >= 12 ? "PM" : "AM";
	const hour12 = hours % 12 || 12;
	return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function capitalizeWords(str: string) {
	if (!str) return "";
	return str
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

/** e.g. "5 minutes ago" */
export function formatRelativeTime(timestamp: number): string {
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Store the calendar day the user picked (local Y-M-D) as UTC midnight so
 * client and Convex agree on the same day regardless of timezone.
 */
export function toEventDateMs(date: Date): number {
	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Rehydrate a stored event date for pickers and display. */
export function eventDateFromMs(ms: number): Date {
	const d = new Date(ms);
	return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function startOfUtcDayMs(timestampMs: number): number {
	const d = new Date(timestampMs);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** True when the calendar day of eventDate is today or later. */
export function isEventDateOnOrAfterToday(eventDateMs: number | Date): boolean {
	const ms =
		eventDateMs instanceof Date ? toEventDateMs(eventDateMs) : eventDateMs;
	return ms >= toEventDateMs(new Date());
}

export function formatFieldErrors(errors: unknown[]): string {
	return errors
		.map((err) =>
			typeof err === "string"
				? err
				: (err as { message?: string; issue?: { message?: string } })
						?.message ||
					(err as { issue?: { message?: string } })?.issue?.message ||
					"Invalid input",
		)
		.join(", ");
}
