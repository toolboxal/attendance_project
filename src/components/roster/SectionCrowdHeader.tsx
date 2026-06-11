import { tv } from "tailwind-variants";
import {
	type Activity,
	formatShiftRange,
	getActivityOption,
	getOccupancyFillVisual,
	type OccupancyFill,
} from "#/lib/sectionReport";
import { capitalizeWords, cn } from "#/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { SectionIncludeInTotalSwitch } from "./SectionIncludeInTotalSwitch";

const activityLabelStyles = tv({
	slots: {
		label: "text-[10px] text-zinc-300",
		metricsContainer: "flex flex-col items-start gap-1",
	},
});
type SectionCrowdHeaderProps = {
	name: string;
	startTime?: string;
	endTime?: string;
	activity?: Activity;
	occupancyFill?: OccupancyFill;
	headcount?: number;
	activeCount?: number;
	sectionId?: Id<"eventSections">;
	includeInTotal?: boolean;
	canToggleIncludeInTotal?: boolean;
};

export function SectionCrowdHeader({
	name,
	startTime,
	endTime,
	activity = "normal",
	occupancyFill = "0",
	headcount,
	activeCount,
	sectionId,
	includeInTotal = false,
	canToggleIncludeInTotal = false,
}: SectionCrowdHeaderProps) {
	const shift = formatShiftRange(startTime, endTime);
	const activityOption = getActivityOption(activity);
	const displayName = capitalizeWords(name);

	const { label, metricsContainer } = activityLabelStyles();
	const occupancyVisual = getOccupancyFillVisual(occupancyFill);

	const showIncludeInTotal = headcount != null && sectionId != null;

	return (
		<div className="flex min-w-0 flex-1 items-center gap-2 px-1">
			<div className="flex min-w-0 flex-1 flex-col gap-1 pr-1">
				<div className="flex flex-wrap items-center gap-1.5 px-1">
					<span className="text-sm font-semibold text-zinc-100">
						{displayName}
					</span>
					{shift ? (
						<span className="text-[12px] font-mono text-yellow-200 ml-auto">
							{shift}
						</span>
					) : null}
				</div>
				<div className="flex flex-row items-start gap-3 px-1 text-[11px]">
					{activeCount != null ? (
						<div className={metricsContainer()}>
							<span className={label()}>staff</span>

							<span className="text-zinc-300">{activeCount} active</span>
						</div>
					) : null}
					<div className={metricsContainer()}>
						<span className={label()}>activity lvl.</span>
						<span
							className={cn(
								"font-bold uppercase text-[10px]",
								activityOption.badgeClass,
							)}
						>
							{activityOption.label}
						</span>
					</div>
					<div className={metricsContainer()}>
						<span className={label()}>occupancy</span>
						<span
							className={cn(
								"text-[11px] font-medium",
								occupancyVisual.labelClass,
							)}
						>
							{occupancyVisual.label}
						</span>
					</div>
					<div className="flex flex-row items-start gap-3 ml-auto">
						{headcount != null ? (
							<div className={metricsContainer({ class: "items-end" })}>
								<span className={label()}>headcount</span>
								<span className="text-zinc-300 font-bold">{headcount}</span>
							</div>
						) : null}
						{showIncludeInTotal ? (
							<SectionIncludeInTotalSwitch
								sectionId={sectionId}
								includeInTotal={includeInTotal}
								canToggle={canToggleIncludeInTotal}
							/>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
