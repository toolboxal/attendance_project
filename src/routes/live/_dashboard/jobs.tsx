import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { tv } from "tailwind-variants";
import { DispatchPanel } from "#/components/jobs/DispatchPanel";
import { JobItem } from "#/components/jobs/JobItem";
import { formatTime12h } from "#/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../../convex/_generated/api";

const layoutStyles = tv({
	slots: {
		container: "py-2 flex flex-col gap-1.5",
	},
});

export const Route = createFileRoute("/live/_dashboard/jobs")({
	component: JobsTabComponent,
});

function JobsTabComponent() {
	const { container } = layoutStyles();

	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, {
			accessToken: localStorage.getItem("asistir_staff_token") ?? "",
		}),
	);
	const { data: activeJobs } = useSuspenseQuery(
		convexQuery(api.jobs.getActiveJobs, {
			accessToken: localStorage.getItem("asistir_staff_token") ?? "",
		}),
	);
	const { data: historyJobs } = useSuspenseQuery(
		convexQuery(api.jobs.getHistoryJobs, {
			accessToken: localStorage.getItem("asistir_staff_token") ?? "",
		}),
	);

	const queueJobs = activeJobs;
	const activeJobLimit = profile?.activeJobLimit ?? 15;

	return (
		<div className="flex-1 flex flex-col gap-2 bg-zinc-950 pb-52">
			{/* Header Area */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-row items-start justify-between">
					<div className="flex flex-col">
						<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
							{profile?.sectionName.toUpperCase()}
						</p>
						<p className="text-xs font-extrabold text-zinc-300 tracking-tight">
							{profile?.roleTitle}
						</p>
						<div className="flex flex-row gap-1 items-center">
							<p className="text-xs font-extrabold text-zinc-400 tracking-tight italic">
								{profile?.name}
							</p>
							<p className="text-xs font-extrabold text-teal-400 tracking-tight italic">
								{profile?.role}
							</p>
						</div>
					</div>
					<div className="flex flex-col">
						<span className="text-zinc-200 text-xs font-semibold self-end">
							{profile?.eventDate
								? format(new Date(profile.eventDate), "PPPP")
								: "Date TBD"}
						</span>
						<span className="text-yellow-200 text-xs font-mono self-end">
							{profile?.sectionStartTime
								? formatTime12h(profile.sectionStartTime)
								: profile?.eventTime
									? formatTime12h(profile.eventTime)
									: "Time TBD"}
							{profile?.sectionEndTime
								? ` - ${formatTime12h(profile.sectionEndTime)}`
								: ""}
						</span>
					</div>
				</div>
			</div>
			<Tabs defaultValue="pending">
				<TabsList variant={"line"}>
					<TabsTrigger value="pending">
						Active Jobs ({" "}
						<span
							className={`font-semibold ${activeJobs.length >= activeJobLimit ? "text-red-500" : "text-green-400"}`}
						>
							{queueJobs.length}
						</span>
						<span className="font-semibold">/ {activeJobLimit} Max)</span>
					</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
				</TabsList>
				<TabsContent value="pending">
					<div className={container()}>
						{queueJobs.map((job) => (
							<JobItem key={job._id} job={job} currentStaffId={profile?._id} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="history">
					<div className={container()}>
						{historyJobs.map((job) => (
							<JobItem key={job._id} job={job} currentStaffId={profile?._id} />
						))}
					</div>
				</TabsContent>
			</Tabs>

			<DispatchPanel isQueueFull={queueJobs.length >= activeJobLimit} />
		</div>
	);
}
