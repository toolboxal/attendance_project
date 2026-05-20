import { ConvexError } from "convex/values";

export interface StructuredErrorData {
	title?: string;
	reason?: string;
	actionNeeded?: string;
	errorType?: string | number;
}

/**
 * Robustly extracts structured error data from various error formats,
 * including ConvexError and stringified server errors.
 */
export function parseStructuredError(error: unknown): StructuredErrorData {
	// 1. Direct ConvexError instance
	if (error instanceof ConvexError && typeof error.data === "object") {
		return error.data as StructuredErrorData;
	}

	// 2. Object with a 'data' property (common in serialized errors)
	if (
		typeof error === "object" &&
		error !== null &&
		"data" in error &&
		typeof (error as { data: unknown }).data === "object"
	) {
		return (error as { data: StructuredErrorData }).data;
	}

	// 3. Stringified ConvexError in the message (fallback for some network wrappers)
	if (error instanceof Error && error.message.includes("ConvexError:")) {
		try {
			const jsonMatch = error.message.match(/ConvexError:\s*({.*})/);
			if (jsonMatch?.[1]) {
				return JSON.parse(jsonMatch[1]) as StructuredErrorData;
			}
		} catch {
			// Fallback if parsing fails
		}
	}

	return {};
}
