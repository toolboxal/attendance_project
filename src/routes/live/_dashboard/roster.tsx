import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { tv } from "tailwind-variants";
import { RosterSectionAccordion } from "#/components/roster/RosterSectionAccordion";
import { SectionHeadcountBreakdown } from "#/components/roster/SectionHeadcountBreakdown";
import { SectionReportPanel } from "#/components/roster/SectionReportPanel";
import type { OccupancyFill } from "#/lib/sectionReport";
import { Accordion } from "#/components/ui/accordion";
import { getStaffAccessToken } from "#/lib/staffToken";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
	FLOATING_SECTION_KEY,
	UNASSIGNED_SECTION_KEY,
} from "../../../../convex/constants";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 pb-36 min-h-0",
	},
});

export const Route = createFileRoute("/live/_dashboard/roster")({
	component: RosterTabComponent,
});

function isNamedSection(sectionKey: string) {
	return (
		sectionKey !== FLOATING_SECTION_KEY && sectionKey !== UNASSIGNED_SECTION_KEY
	);
}

function RosterTabComponent() {
	const { container } = layoutStyles();
	const accessToken = getStaffAccessToken();

	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, { accessToken }),
	);
	const { data: layout } = useSuspenseQuery(
		convexQuery(api.sections.getRosterLayout, { accessToken }),
	);
	const { data: staffData } = useSuspenseQuery(
		convexQuery(api.sections.getRosterStaff, { accessToken }),
	);

	const viewerAssignedSectionKeys = useMemo(() => {
		if (!layout || !staffData) return new Set<string>();
		const keys = new Set<string>();
		for (const section of layout.sections) {
			if (!isNamedSection(section.sectionKey)) continue;
			const slots = staffData.staffBySection[section.sectionKey] ?? [];
			if (slots.some((s) => s.isViewer)) {
				keys.add(section.sectionKey);
			}
		}
		return keys;
	}, [layout, staffData]);

	const viewerSection = useMemo(() => {
		if (!layout) return null;
		return (
			layout.sections.find(
				(section) =>
					isNamedSection(section.sectionKey) &&
					viewerAssignedSectionKeys.has(section.sectionKey),
			) ?? null
		);
	}, [layout, viewerAssignedSectionKeys]);

	const { totalHeadcount, breakdownSections } = useMemo(() => {
		if (!layout) return { totalHeadcount: 0, breakdownSections: [] };
		let total = 0;
		const breakdown: Array<{
			sectionKey: string;
			name: string;
			headcount: number;
			occupancyFill: OccupancyFill;
		}> = [];

		for (const section of layout.sections) {
			if (!isNamedSection(section.sectionKey)) continue;
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
	}, [layout]);

	if (!layout || !staffData) {
		return null;
	}

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
					<div className="flex flex-col px-2">
						<span className="text-[10px] text-zinc-300 text-nowrap">
							Total Headcount
						</span>
						<div className="flex flex-row items-center gap-1">
							<span className="text-xl font-bold text-blue-400">
								{totalHeadcount.toLocaleString()}
							</span>
							<span className="text-zinc-500 text-sm">pax</span>
						</div>
					</div>
					<SectionHeadcountBreakdown sections={breakdownSections} />
				</div>
			) : null}

			<div className={container()}>
				{layout.sections.length === 0 ? (
					<p className="text-sm text-zinc-500 text-center py-8">
						No sections configured for this event.
					</p>
				) : (
					<Accordion type="multiple" className="w-full ">
						{layout.sections.map((section) => (
							<RosterSectionAccordion
								key={section.sectionKey}
								section={section}
								slots={staffData.staffBySection[section.sectionKey] ?? []}
								canToggleIncludeInTotal={
									profile?.isAdmin === true || profile?.isSupervisor === true
								}
							/>
						))}
					</Accordion>
				)}
			</div>

			{viewerSection && viewerServerState ? (
				<SectionReportPanel
					sectionId={viewerSection.sectionKey as Id<"eventSections">}
					sectionName={viewerSection.name}
					startTime={viewerSection.startTime}
					endTime={viewerSection.endTime}
					serverState={viewerServerState}
				/>
			) : null}
		</div>
	);
}
