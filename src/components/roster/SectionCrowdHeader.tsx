import {
	type Activity,
	formatOccupancyFill,
	formatShiftRange,
	getActivityOption,
	type OccupancyFill,
} from "#/lib/sectionReport";
import { cn } from "#/lib/utils";

type SectionCrowdHeaderProps = {
	name: string;
	startTime?: string;
	endTime?: string;
	activity?: Activity;
	headcountReporting?: boolean;
	occupancyFill?: OccupancyFill;
	headcount?: number;
	activeCount?: number;
};

export function SectionCrowdHeader({
	name,
	startTime,
	endTime,
	activity = "normal",
	headcountReporting = false,
	occupancyFill,
	headcount,
	activeCount,
}: SectionCrowdHeaderProps) {
	const shift = formatShiftRange(startTime, endTime);
	const activityOption = getActivityOption(activity);
	const displayName =
		name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

	return (
		<div className="flex min-w-0 flex-1 flex-col gap-1 pr-1">
			<div className="flex flex-wrap items-center gap-1.5">
				<span className="text-sm font-semibold text-zinc-100">
					{displayName}
				</span>
				{shift ? (
					<span className="text-[10px] font-mono text-zinc-500">{shift}</span>
				) : null}
			</div>
			<div className="flex flex-wrap items-center gap-1.5 text-[11px]">
				<span
					className={cn(
						"font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-[9px]",
						activityOption.badgeClass,
					)}
				>
					{activityOption.label}
				</span>
				{headcountReporting && occupancyFill != null ? (
					<span className="text-zinc-400">
						{formatOccupancyFill(occupancyFill)}
					</span>
				) : null}
				{headcount != null ? (
					<span className="text-zinc-300">{headcount} pax</span>
				) : null}
				{activeCount != null ? (
					<span className="text-zinc-500">{activeCount} active</span>
				) : null}
			</div>
		</div>
	);
}
