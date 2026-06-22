import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
	DashboardCreditsMetrics,
	type DashboardCredits,
} from "#/components/dashboard/DashboardCreditsMetrics";
import { Button } from "#/components/ui/button";
import { eventDateFromMs, formatTime12h } from "#/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

type DashboardIdleChromeProps = {
	nextDraft: Doc<"events"> | null;
	credits: DashboardCredits;
};

export function DashboardIdleChrome({
	nextDraft,
	credits,
}: DashboardIdleChromeProps) {
	const navigate = useNavigate();

	return (
		<>
			<DashboardCreditsMetrics credits={credits} />
			{nextDraft ? (
				<div className="flex flex-col gap-2 rounded-xl bg-linear-to-r from-yellow-900/70 to-yellow-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
							Next up
						</p>
						<p className="font-medium text-zinc-100">{nextDraft.title}</p>
						<p className="text-xs text-zinc-400">
							{format(eventDateFromMs(nextDraft.eventDate), "PPPP")} ·{" "}
							{formatTime12h(nextDraft.startTime)}
						</p>
					</div>
					<Button
						variant="link"
						size="default"
						className="shrink-0 text-zinc-400 hover:text-zinc-200"
						onClick={() => navigate({ to: "/app/events" })}
					>
						Continue setup
					</Button>
				</div>
			) : null}
		</>
	);
}
