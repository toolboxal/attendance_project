import { Check } from "lucide-react";
import { tv } from "tailwind-variants";
import { JobItem } from "#/components/jobs/JobItem";
import { DemoDispatchPanel } from "#/demo/components/DemoDispatchPanel";
import { DemoProfileHeader } from "#/demo/components/DemoProfileHeader";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import { demoJobToEnriched } from "#/demo/utils";
import { MAX_ACTIVE_JOBS } from "../../../convex/constants";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 pb-36",
	},
});

export function DemoJobsTab() {
	const { container } = layoutStyles();
	const {
		state,
		activeJobs,
		acceptJob,
		rejectJob,
		resolveJob,
		cancelJob,
	} = useDemoFloor();
	const { profile } = state;

	const relevantJobs = activeJobs.filter(
		(job) =>
			(job.creatorId === profile.id || job.claimerId === profile.id) &&
			job.status === "accepted",
	);

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			{relevantJobs.length > 0 ? (
				<div className="flex flex-col gap-1.5 rounded-md p-1">
					{relevantJobs.map((relevantJob) => {
						const isCreator = relevantJob.creatorId === profile.id;
						const message = isCreator
							? `${relevantJob.claimerName ?? "Someone"} accepted your Job ${relevantJob.ticketNumber}`
							: `You accepted Job ${relevantJob.ticketNumber}`;

						return (
							<div
								className="flex flex-col rounded-sm bg-zinc-950 px-2.5 py-2 shadow-sm shadow-zinc-600"
								key={relevantJob.id}
							>
								<div className="flex flex-row items-center gap-1">
									<Check
										size={10}
										className="text-emerald-300"
										strokeWidth={2}
									/>
									<p className="text-[13px] font-medium text-zinc-300">
										{message}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<DemoProfileHeader profile={profile} />
			)}

			<div className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800 mt-2">
				<span className="text-zinc-400 font-black text-sm uppercase">
					Traffic Jobs ({" "}
					<span
						className={`font-bold ${activeJobs.length >= MAX_ACTIVE_JOBS ? "text-red-500" : "text-green-400"}`}
					>
						{activeJobs.length}
					</span>
					<span className="font-bold">/ {MAX_ACTIVE_JOBS} Max)</span>
				</span>
			</div>

			<div className={container()}>
				{activeJobs.map((job) => (
					<JobItem
						key={job.id}
						job={demoJobToEnriched(job)}
						currentStaffId={profile.id}
						isSupervisor={profile.isSupervisor}
						canParticipateOnFloor
						onAccept={acceptJob}
						onReject={rejectJob}
						onResolve={resolveJob}
						onCancel={cancelJob}
					/>
				))}
			</div>

			<DemoDispatchPanel isQueueFull={activeJobs.length >= MAX_ACTIVE_JOBS} />
		</div>
	);
}
