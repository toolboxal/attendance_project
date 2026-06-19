import { format } from "date-fns";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import {
	bucketJobCreationTimes,
	DASHBOARD_JOB_BUCKET_MINUTES,
	formatBucketRangeLabel,
} from "#/lib/job-activity-buckets";
import { capitalizeWords } from "#/lib/utils";

const chartConfig = {
	count: {
		label: "Jobs",
		color: "var(--chart-1)",
	},
};

export type JobActivityChartProps = {
	jobsTotal: number;
	creationTimes: number[];
	windowStart: number;
	windowEnd: number;
	busiestSection: { name: string; count: number } | null;
	busiestCreator: { name: string; count: number } | null;
};

export function JobActivityChart({
	jobsTotal,
	creationTimes,
	windowStart,
	windowEnd,
	busiestSection,
	busiestCreator,
}: JobActivityChartProps) {
	const { buckets, peakCount, peakBucketStart } = useMemo(
		() =>
			bucketJobCreationTimes(
				creationTimes,
				windowStart,
				windowEnd,
				DASHBOARD_JOB_BUCKET_MINUTES,
			),
		[creationTimes, windowStart, windowEnd],
	);

	const chartData = buckets.map((bucket) => ({
		label: format(new Date(bucket.bucketStart), "h:mm a"),
		rangeLabel: formatBucketRangeLabel(
			bucket.bucketStart,
			DASHBOARD_JOB_BUCKET_MINUTES,
		),
		count: bucket.count,
	}));

	const peakLabel =
		peakBucketStart != null
			? formatBucketRangeLabel(peakBucketStart, DASHBOARD_JOB_BUCKET_MINUTES)
			: null;

	return (
		<Card className="border-zinc-800/50 bg-zinc-800/20 ring-0">
			<CardHeader className="px-4 gap-1">
				<CardTitle className="text-sm font-bold text-zinc-50">
					Traffic Jobs
				</CardTitle>
				{jobsTotal > 0 ? (
					<div className="flex flex-col gap-0.5 text-xs font-mono tracking-tight text-zinc-300">
						{peakLabel && peakCount > 0 ? (
							<p>
								Busiest time: {peakLabel} ({peakCount} jobs)
							</p>
						) : null}
						{busiestSection ? (
							<p>
								Busiest section: {capitalizeWords(busiestSection.name)} (
								{busiestSection.count} jobs)
							</p>
						) : null}
						{busiestCreator ? (
							<p>
								Busiest person: {busiestCreator.name} ({busiestCreator.count}{" "}
								jobs)
							</p>
						) : null}
						{!peakLabel && !busiestSection && !busiestCreator ? (
							<p className="text-zinc-500 font-sans">Jobs created over time</p>
						) : null}
					</div>
				) : (
					<p className="text-xs text-zinc-500">Jobs created over time</p>
				)}
			</CardHeader>
			<CardContent className="px-4">
				{jobsTotal === 0 ? (
					<p className="text-xs text-zinc-500 italic">
						No jobs dispatched yet.
					</p>
				) : (
					<ChartContainer
						config={chartConfig}
						className="aspect-2/1 w-full min-h-[200px]"
					>
						<BarChart data={chartData} margin={{ left: -16, bottom: 0 }}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="label"
								tickLine={false}
								axisLine={false}
								tick={{ fontSize: 10, fill: "#a1a1aa" }}
								interval="preserveStartEnd"
								minTickGap={32}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								allowDecimals={false}
								width={28}
								tick={{ fontSize: 10, fill: "#a1a1aa" }}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										labelFormatter={(_, items) =>
											(
												items?.[0]?.payload as
													| { rangeLabel?: string }
													| undefined
											)?.rangeLabel ?? ""
										}
										nameKey="count"
									/>
								}
							/>
							<Bar
								dataKey="count"
								fill="var(--color-count)"
								radius={[4, 4, 0, 0]}
							/>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
