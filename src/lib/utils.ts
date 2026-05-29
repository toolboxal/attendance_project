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
