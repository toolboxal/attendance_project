import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";
import { parseStructuredError } from "#/lib/error-utils";

export function GlobalErrorComponent({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	// Extract structured data from ConvexError if available
	const errorData = parseStructuredError(error);
	const title = errorData.title || "Something went wrong";
	const reason = errorData.reason || "An unexpected error occurred.";
	const actionNeeded =
		errorData.actionNeeded || "Please try again or contact support.";
	const errorType = errorData.errorType;

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 py-24 sm:py-32 lg:px-8">
			{/* Decorative background glows */}
			<div className="absolute top-1/4 left-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-red-500/10 blur-[120px]" />

			<div className="relative group w-full max-w-md rounded-2xl bg-neutral-900/40 p-8 text-center backdrop-blur-xl border border-neutral-800/50 shadow-2xl transition-all duration-300 hover:border-neutral-700/50">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-6">
					<AlertCircle className="h-8 w-8" />
				</div>

				<h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
					{title}
				</h1>
				{errorType && (
					<p className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest mb-2">
						Error Code: {errorType}
					</p>
				)}
				<p className="mt-3 text-sm leading-6 text-neutral-400">{reason}</p>
				<p className="mt-1 text-xs text-neutral-500 italic">{actionNeeded}</p>

				<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button
						type="button"
						onClick={() => reset()}
						variant="default"
						size="lg"
						className="w-full sm:w-auto gap-2"
					>
						<RefreshCcw className="h-4 w-4" />
						Try Again
					</Button>
					<Button
						type="button"
						onClick={() => router.navigate({ to: "/" })}
						variant="secondary"
						size="lg"
						className="w-full sm:w-auto"
					>
						Go Home
					</Button>
				</div>
			</div>
		</div>
	);
}
