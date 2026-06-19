import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { DashboardMetricCard } from "#/components/dashboard/DashboardMetricCard";
import { JobActivityChart } from "#/components/dashboard/JobActivityChart";
import { OccupancyFillLegend } from "#/components/roster/OccupancyFillLegend";
import { SectionHeadcountBreakdown } from "#/components/roster/SectionHeadcountBreakdown";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type LiveFloorOverviewProps = {
	eventId: string;
	showOpenCounts?: boolean;
};

export function LiveFloorOverview(props: LiveFloorOverviewProps) {
	if (!props.eventId) return null;
	return <LiveFloorOverviewInner {...props} />;
}

function LiveFloorOverviewInner({
	eventId,
	showOpenCounts = true,
}: LiveFloorOverviewProps) {
	const { data: sectionsData } = useSuspenseQuery(
		convexQuery(api.events.getDashboardSections, {
			eventId: eventId as Id<"events">,
		}),
	);
	const { data: jobsData } = useSuspenseQuery(
		convexQuery(api.events.getDashboardJobs, {
			eventId: eventId as Id<"events">,
		}),
	);
	const { data: incidentsData } = useSuspenseQuery(
		convexQuery(api.events.getDashboardIncidents, {
			eventId: eventId as Id<"events">,
		}),
	);
	const { data: staffData } = useSuspenseQuery(
		convexQuery(api.events.getDashboardStaff, {
			eventId: eventId as Id<"events">,
		}),
	);

	if (!sectionsData || !jobsData || !incidentsData) return null;

	const jobsDisplay = showOpenCounts ? jobsData.jobsOpen : jobsData.jobsTotal;
	const incidentsDisplay = showOpenCounts
		? incidentsData.incidentsOpen
		: incidentsData.incidentsTotal;
	const jobsLabel = showOpenCounts ? "Open jobs" : "Total jobs";
	const incidentsLabel = showOpenCounts ? "Open incidents" : "Total incidents";

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<DashboardMetricCard
					label={jobsLabel}
					value={jobsDisplay}
					subtitle={
						showOpenCounts && jobsData.jobsTotal > jobsData.jobsOpen
							? `${jobsData.jobsTotal} total`
							: undefined
					}
				/>
				<DashboardMetricCard
					label={incidentsLabel}
					value={incidentsDisplay}
					subtitle={
						showOpenCounts &&
						incidentsData.incidentsTotal > incidentsData.incidentsOpen
							? `${incidentsData.incidentsTotal} total`
							: undefined
					}
				/>
				{showOpenCounts && staffData ? (
					<DashboardMetricCard
						label="Staff on floor"
						value={staffData.activeStaffCount}
						icon={<Users className="size-4 text-zinc-400" />}
					/>
				) : null}
				<DashboardMetricCard
					label="Total headcount"
					value={sectionsData.totalHeadcount.toLocaleString()}
					subtitle="pax"
				/>
			</div>

			<Card className="border-zinc-800/50 bg-zinc-800/20 ring-0">
				<CardHeader className="px-4">
					<CardTitle className="text-sm font-bold text-zinc-50">
						Occupancy
					</CardTitle>
				</CardHeader>
				<CardContent className="px-4 flex min-w-0 flex-col gap-3">
					<OccupancyFillLegend />
					{sectionsData.breakdownSections.length > 0 ? (
						<SectionHeadcountBreakdown
							sections={sectionsData.breakdownSections}
						/>
					) : (
						<p className="text-xs text-zinc-500 italic">
							No headcount reported yet.
						</p>
					)}
				</CardContent>
			</Card>

			<JobActivityChart
				jobsTotal={jobsData.jobsTotal}
				creationTimes={jobsData.creationTimes}
				windowStart={jobsData.windowStart}
				windowEnd={jobsData.windowEnd}
				busiestSection={jobsData.busiestSection}
				busiestCreator={jobsData.busiestCreator}
			/>
		</div>
	);
}
