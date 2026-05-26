import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { tv } from "tailwind-variants";
import { DispatchPanel } from "#/components/jobs/DispatchPanel";
import { JobItem } from "#/components/jobs/JobItem";
import { formatTime12h } from "#/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { MAX_ACTIVE_JOBS } from "../../../../convex/constants";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-0.5 pb-36",
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

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
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
							<p className="text-xs font-extrabold text-yellow-400 tracking-tight italic">
								{profile?.name}
							</p>
							<p className="text-xs font-extrabold text-yellow-400 tracking-tight italic">
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

			{/* Queue Header Counter */}
			<div className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800 mt-2">
				<span className="text-zinc-400 font-black text-sm uppercase">
					Active Jobs ({" "}
					<span
						className={`font-bold ${activeJobs.length >= MAX_ACTIVE_JOBS ? "text-red-500" : "text-green-400"}`}
					>
						{activeJobs.length}
					</span>
					<span className="font-bold">/ {MAX_ACTIVE_JOBS} Max)</span>
				</span>
			</div>

			{/* Queue Stream */}
			<div className={container()}>
				{activeJobs.map((job) => (
					<JobItem key={job._id} job={job} currentStaffId={profile?._id} />
				))}
			</div>

			<DispatchPanel isQueueFull={activeJobs.length >= MAX_ACTIVE_JOBS} />
		</div>
	);
}
