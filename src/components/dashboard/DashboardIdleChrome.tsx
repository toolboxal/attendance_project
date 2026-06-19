import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Button } from "#/components/ui/button";
import { eventDateFromMs, formatTime12h } from "#/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

type Credits = {
	monthlyCredits: number;
	oneTimeCredits: number;
	billingPlan: string;
};

type DashboardIdleChromeProps = {
	nextDraft: Doc<"events"> | null;
	credits: Credits;
};

export function DashboardIdleChrome({
	nextDraft,
	credits,
}: DashboardIdleChromeProps) {
	const navigate = useNavigate();
	const totalCredits = credits.monthlyCredits + credits.oneTimeCredits;
	const creditsLow = totalCredits === 0 && credits.billingPlan !== "pro_monthly";

	return (
		<>
			{nextDraft ? (
				<div className="flex flex-col gap-2 rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
							Next up
						</p>
						<p className="font-medium text-zinc-100">{nextDraft.title}</p>
						<p className="text-xs text-zinc-400">
							{format(eventDateFromMs(nextDraft.eventDate), "PP")} ·{" "}
							{formatTime12h(nextDraft.startTime)}
						</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						className="shrink-0"
						onClick={() => navigate({ to: "/app/events" })}
					>
						Continue setup
					</Button>
				</div>
			) : null}

			<div className="flex flex-row items-center justify-between gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-4 py-2">
				<div className="text-xs text-zinc-400">
					<span className="text-zinc-200 font-medium">
						{credits.monthlyCredits}
					</span>{" "}
					monthly ·{" "}
					<span className="text-zinc-200 font-medium">
						{credits.oneTimeCredits}
					</span>{" "}
					one-time credits
				</div>
				{creditsLow ? (
					<Button
						variant="link"
						size="sm"
						className="text-xs h-auto p-0"
						onClick={() => navigate({ to: "/app/billing" })}
					>
						Top up
					</Button>
				) : null}
			</div>
		</>
	);
}
