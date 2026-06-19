import { getOccupancyFillVisual, OCCUPANCY_OPTIONS } from "#/lib/sectionReport";
import { cn } from "#/lib/utils";

export function OccupancyFillLegend({ className }: { className?: string }) {
	return (
		<div className={cn("flex flex-wrap gap-x-3 gap-y-1.5", className)}>
			{OCCUPANCY_OPTIONS.map((option) => {
				const visual = getOccupancyFillVisual(option);
				return (
					<div key={option} className="flex items-center gap-1.5">
						<span
							className={cn("size-2.5 shrink-0", visual.fillClass)}
							aria-hidden
						/>
						<span className="text-[10px] text-zinc-400">{visual.label}</span>
					</div>
				);
			})}
		</div>
	);
}
