import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo } from "react";
import { tv } from "tailwind-variants";
import { RosterSectionAccordion } from "#/components/roster/RosterSectionAccordion";
import { SectionReportPanel } from "#/components/roster/SectionReportPanel";
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

	const { totalHeadcount, includedCount } = useMemo(() => {
		if (!layout) return { totalHeadcount: 0, includedCount: 0 };
		let total = 0;
		let count = 0;
		for (const section of layout.sections) {
			if (!isNamedSection(section.sectionKey)) continue;
			if (section.includeInTotal) {
				total += section.headcount;
				count += 1;
			}
		}
		return { totalHeadcount: total, includedCount: count };
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
			<div className="flex flex-col gap-1 px-1 pb-2 shrink-0">
				<div className="flex flex-row items-start justify-between gap-2">
					<div>
						<p className="text-xs font-semibold text-zinc-100">Roster</p>
						{profile?.eventDate ? (
							<p className="text-[11px] text-zinc-500">
								{format(new Date(profile.eventDate), "PPPP")}
							</p>
						) : null}
					</div>
					<p className="text-[11px] text-zinc-400 text-right">
						Total reported · {totalHeadcount.toLocaleString()} pax
						<br />
						<span className="text-zinc-600">
							({includedCount} section{includedCount === 1 ? "" : "s"})
						</span>
					</p>
				</div>
			</div>

			<div className={container()}>
				{layout.sections.length === 0 ? (
					<p className="text-sm text-zinc-500 text-center py-8">
						No sections configured for this event.
					</p>
				) : (
					<Accordion type="multiple" className="w-full">
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
