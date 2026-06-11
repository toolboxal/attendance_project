import {
	getOccupancyFillVisual,
	type OccupancyFill,
} from "#/lib/sectionReport";
import { capitalizeWords, cn } from "#/lib/utils";

export type BreakdownSection = {
	sectionKey: string;
	name: string;
	headcount: number;
	occupancyFill: OccupancyFill;
};

type SectionHeadcountBreakdownProps = {
	sections: BreakdownSection[];
};

export function SectionHeadcountBreakdown({
	sections,
}: SectionHeadcountBreakdownProps) {
	if (sections.length === 0) {
		return null;
	}

	const maxHeadcount = Math.max(...sections.map((s) => s.headcount), 1);

	return (
		<div className="flex flex-col gap-0 px-1 w-full">
			{sections.map((section) => {
				const widthPercent = (section.headcount / maxHeadcount) * 100;
				const occupancyVisual = getOccupancyFillVisual(section.occupancyFill);

				return (
					<div
						key={section.sectionKey}
						className="grid grid-cols-[minmax(0,3.5rem)_1fr_auto] items-center gap-x-0.5"
					>
						<span className="truncate text-[9px] text-zinc-300">
							{capitalizeWords(section.name)}
						</span>
						<div
							className={cn(
								"h-3 min-w-2 transition-[width] duration-300",
								occupancyVisual.fillClass,
							)}
							style={{
								width: `${Math.max(widthPercent, section.headcount > 0 ? 2 : 0)}%`,
							}}
						/>
						<span className="text-[11px] font-medium tabular-nums text-zinc-300 ml-2">
							{section.headcount.toLocaleString()}
						</span>
					</div>
				);
			})}
		</div>
	);
}
