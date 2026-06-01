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
	const relevantJobs = activeJobs.filter(
		(job) =>
			(job.creatorId === profile?._id || job.claimerId === profile?._id) &&
			job.status === "accepted",
	);

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			{relevantJobs.length > 0 ? (
				<div className="flex flex-col gap-1.5 rounded-md p-1">
					{relevantJobs.map((relevantJob) => {
						const isCreator = relevantJob.creatorId === profile?._id;
						const message = isCreator
							? `${relevantJob.claimerName ?? "Someone"} has accepted your job`
							: `You have accepted ${relevantJob.creatorName}'s job`;

						return (
							<div
								className="flex flex-col rounded-md bg-zinc-900 px-2.5 py-1 shadow-sm shadow-emerald-700"
								key={relevantJob._id}
							>
								<p className="text-xs font-semibold text-emerald-50">
									{message}
								</p>
								<p className="text-[11px] text-emerald-200">
									{relevantJob.originSectionName}
									{relevantJob.personCount >= 1
										? ` · ${relevantJob.personCount} pax`
										: ""}
									{relevantJob.requestType
										? ` · ${relevantJob.requestType}`
										: ""}
								</p>
							</div>
						);
					})}
				</div>
			) : (
				<div className="flex flex-col gap-4">
					<div className="flex flex-row items-start justify-between">
						<div className="flex flex-col">
							<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
								{profile?.sectionName?.toUpperCase() ?? "EVENT"}
							</p>
							<p className="text-xs font-extrabold text-zinc-300 tracking-tight">
								{profile?.roleTitle}
							</p>
							<div className="flex flex-row items-center gap-1">
								<p className="text-xs font-extrabold text-yellow-400 tracking-tight italic">
									{profile?.name}
								</p>
								<p className="text-xs font-extrabold text-yellow-400 tracking-tight italic">
									{profile?.role}
								</p>
							</div>
						</div>
						<div className="flex flex-col">
							<span className="self-end text-xs font-semibold text-zinc-200">
								{profile?.eventDate
									? format(new Date(profile.eventDate), "PPPP")
									: "Date TBD"}
							</span>
							<span className="self-end font-mono text-xs text-yellow-200">
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
			)}

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
					<JobItem
						key={job._id}
						job={job}
						currentStaffId={profile?._id}
						isSupervisor={profile?.isSupervisor}
					/>
				))}
			</div>

			<DispatchPanel isQueueFull={activeJobs.length >= MAX_ACTIVE_JOBS} />
		</div>
	);
}
