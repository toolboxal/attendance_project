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
		<div className="flex w-full min-w-0 flex-col gap-0 px-1">
			{sections.map((section) => {
				const widthPercent = (section.headcount / maxHeadcount) * 100;
				const occupancyVisual = getOccupancyFillVisual(section.occupancyFill);

				return (
					<div
						key={section.sectionKey}
						className="flex min-w-0 flex-nowrap items-center gap-x-1"
					>
						<span className="w-14 shrink-0 truncate text-[9px] text-zinc-300">
							{capitalizeWords(section.name)}
						</span>
						<div className="h-3 min-w-0 flex-1">
							<div
								className={cn(
									"h-full min-w-0 transition-[width] duration-300",
									occupancyVisual.fillClass,
								)}
								style={{
									width: `${Math.max(widthPercent, section.headcount > 0 ? 2 : 0)}%`,
								}}
							/>
						</div>
						<span className="w-10 shrink-0 text-right text-[11px] font-medium tabular-nums text-zinc-300">
							{section.headcount.toLocaleString()}
						</span>
					</div>
				);
			})}
		</div>
	);
}
