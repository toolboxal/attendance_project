import { useMemo } from "react";
import { tv } from "tailwind-variants";
import { RosterSectionAccordion } from "#/components/roster/RosterSectionAccordion";
import { SectionHeadcountBreakdown } from "#/components/roster/SectionHeadcountBreakdown";
import type { OccupancyFill } from "#/lib/sectionReport";
import { Accordion } from "#/components/ui/accordion";
import { DemoSectionReportPanel } from "#/demo/components/DemoSectionReportPanel";
import { useDemoFloor } from "#/demo/DemoFloorContext";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 pb-36 min-h-0",
	},
});

export function DemoRosterTab() {
	const { container } = layoutStyles();
	const { state, reportSection, toggleIncludeInTotal } = useDemoFloor();
	const { profile, sections } = state;

	const viewerSection = useMemo(
		() => sections.find((section) => section.sectionKey === profile.sectionId),
		[sections, profile.sectionId],
	);

	const { totalHeadcount, breakdownSections } = useMemo(() => {
		let total = 0;
		const breakdown: Array<{
			sectionKey: string;
			name: string;
			headcount: number;
			occupancyFill: OccupancyFill;
		}> = [];

		for (const section of sections) {
			if (section.includeInTotal) {
				total += section.headcount;
				if (section.headcount > 0) {
					breakdown.push({
						sectionKey: section.sectionKey,
						name: section.name,
						headcount: section.headcount,
						occupancyFill: section.occupancyFill,
					});
				}
			}
		}

		breakdown.sort((a, b) => b.headcount - a.headcount);

		return { totalHeadcount: total, breakdownSections: breakdown };
	}, [sections]);

	const viewerServerState = viewerSection
		? {
				activity: viewerSection.activity,
				headcountReporting: viewerSection.headcountReporting,
				occupancyFill: viewerSection.occupancyFill,
				headcount: viewerSection.headcount,
			}
		: null;

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			{breakdownSections.length > 0 ? (
				<div className="flex flex-row gap-5 px-1 pb-2 shrink-0">
					<div className="flex flex-col px-1">
						<span className="text-[10px] text-zinc-300 text-nowrap">
							Total Headcount
						</span>
						<div className="flex flex-row items-center gap-1">
							<span className="text-2xl font-bold text-yellow-100">
								{totalHeadcount.toLocaleString()}
							</span>
							<span className="text-zinc-400 text-sm">pax</span>
						</div>
					</div>
					<SectionHeadcountBreakdown sections={breakdownSections} />
				</div>
			) : (
				<div className="flex flex-col px-1 pb-2">
					<p className="text-md font-bold text-zinc-50">Event Roster</p>
					<p className="text-xs text-zinc-300">
						Section reporting of busyness,
						<br /> occupancy level and headcount for each section.
					</p>
				</div>
			)}

			<div className={container()}>
				<Accordion type="multiple" className="w-full">
					{sections.map((section) => (
						<RosterSectionAccordion
							key={section.sectionKey}
							section={section}
							slots={section.slots}
							canToggleIncludeInTotal={profile.isSupervisor}
							onIncludeInTotalChange={(sectionId, includeInTotal) =>
								toggleIncludeInTotal(sectionId, includeInTotal)
							}
						/>
					))}
				</Accordion>
			</div>

			{viewerSection && viewerServerState ? (
				<DemoSectionReportPanel
					sectionKey={viewerSection.sectionKey}
					sectionName={viewerSection.name}
					startTime={viewerSection.startTime}
					endTime={viewerSection.endTime}
					serverState={viewerServerState}
					onSubmit={(report) => reportSection(viewerSection.sectionKey, report)}
				/>
			) : null}
		</div>
	);
}
