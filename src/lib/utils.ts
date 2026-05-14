import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse } from "date-fns";

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
