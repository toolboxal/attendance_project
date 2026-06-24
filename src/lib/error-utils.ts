import * as Sentry from "@sentry/tanstackstart-react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";

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

/** Strip Convex client wrapper text from a plain server Error message. */
export function stripConvexErrorMessage(message: string): string {
	const uncaught = message.match(/Uncaught Error:\s*([\s\S]+)/);
	if (uncaught?.[1]) return uncaught[1].trim();
	return message;
}

/**
 * Show a mutation failure in a toast, using structured ConvexError fields when
 * available and falling back to a cleaned plain error message.
 */
export function toastMutationError(
	error: unknown,
	fallback = "Something went wrong",
) {
	// ConvexErrors are intentional user-facing messages; skip reporting those.
	if (!(error instanceof ConvexError)) {
		Sentry.captureException(error);
	}

	const { title, reason, actionNeeded } = parseStructuredError(error);

	if (title || reason) {
		const description = [reason, actionNeeded].filter(Boolean).join(" ");
		toast.error(title ?? fallback, description ? { description } : undefined);
		return;
	}

	if (error instanceof Error) {
		toast.error(stripConvexErrorMessage(error.message) || fallback);
		return;
	}

	toast.error(fallback);
}
