import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parse } from "date-fns";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Bulletproof date-fns parser that handles 24h format cleanly
export function formatTime12h(timeStr: string) {
	if (!timeStr) return "";
	try {
		// Strip seconds if they exist to normalize before parsing
		const cleanTime = timeStr.substring(0, 5);
		const parsedDate = parse(cleanTime, "HH:mm", new Date());
		return format(parsedDate, "h:mm a");
	} catch (e) {
		return timeStr;
	}
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

/** True when the calendar day of eventDate is today or later. */
export function isEventDateOnOrAfterToday(eventDateMs: number | Date): boolean {
	const ms =
		eventDateMs instanceof Date
			? toEventDateMs(eventDateMs)
			: eventDateMs;
	return ms >= toEventDateMs(new Date());
}

export function formatFieldErrors(errors: unknown[]): string {
	return errors
		.map((err) =>
			typeof err === "string"
				? err
				: (err as { message?: string; issue?: { message?: string } })?.message ||
					(err as { issue?: { message?: string } })?.issue?.message ||
					"Invalid input",
		)
		.join(", ");
}
