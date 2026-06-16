import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getStaffAccessToken } from "#/lib/staffToken";
import { cn } from "#/lib/utils";
import { useLiveCountdown } from "#/hooks/use-live-countdown";
import { api } from "../../../convex/_generated/api";

function StatCard({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className=" bg-zinc-800 px-2.5 py-2 min-w-0">
			<span className="text-[9px] font-bold tracking-wide uppercase text-zinc-400 truncate block mb-0.5">
				{label}
			</span>
			<p
				className={cn(
					"text-base font-bold text-yellow-100 tabular-nums",
					mono && "font-mono text-sm",
				)}
			>
				{value}
			</p>
		</div>
	);
}

export function AdminSituationOverview() {
	const accessToken = getStaffAccessToken();
	const { data: overview } = useSuspenseQuery(
		convexQuery(api.liveStaff.getAdminSituationOverview, { accessToken }),
	);

	const timeRemaining = useLiveCountdown(overview?.expiresAt ?? null);

	if (!overview) return null;

	return (
		<div className="shrink-0 px-1 py-3 space-y-2">
			{/* <div>
				<p className="text-md font-bold text-zinc-50">Situation</p>
				<p className="text-xs text-zinc-300">
					Live event snapshot at a glance.
				</p>
			</div> */}
			<div className="grid grid-cols-3 gap-2">
				<StatCard
					label="Headcount"
					value={overview.totalHeadcount.toLocaleString()}
				/>
				<StatCard
					label="Open incidents"
					value={String(overview.openAlertsCount)}
				/>
				<StatCard
					label="Active traffic"
					value={String(overview.activeJobsCount)}
				/>
				<StatCard
					label="Staff on floor"
					value={String(overview.activeStaffCount)}
				/>
				<StatCard label="Time left" value={timeRemaining} mono />
			</div>
		</div>
	);
}
