import { useMutation } from "convex/react";
import { Check, CornerDownRight, Trash, Undo } from "lucide-react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { usePendingJobTimer } from "#/hooks/use-pending-job-timer";
import { capitalizeWords } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

const PENDING_WARN_AFTER_MS = 2 * 60 * 1000;

type EnrichedJob = Doc<"jobs"> & {
	creatorName: string;
	creatorRole: string | undefined;
	creatorRoleTitle: string;
	claimerName: string | undefined;
	claimerRole: string | undefined;
	claimerRoleTitle: string;
	originSectionName: string;
	destinationSectionName: string | undefined;
	creatorMissing: boolean;
	claimerMissing: boolean;
};

const jobStyles = tv({
	slots: {
		card: "bg-zinc-800/90 rounded-md overflow-hidden text-zinc-50 ",
	},
	variants: {
		status: {
			pending: "",
			accepted: {
				// card: "bg-emerald-700/50 ",
			},
			resolved: {
				card: "bg-zinc-950 opacity-40",
			},
		},
	},
});

export function JobItem({
	job,
	currentStaffId,
	isSupervisor = false,
	canParticipateOnFloor = true,
	preview = false,
	onAccept,
	onReject,
	onResolve,
	onCancel,
}: {
	job: EnrichedJob;
	currentStaffId?: string;
	isSupervisor?: boolean;
	canParticipateOnFloor?: boolean;
	preview?: boolean;
	onAccept?: (jobId: string) => void | Promise<void>;
	onReject?: (jobId: string) => void | Promise<void>;
	onResolve?: (jobId: string) => void | Promise<void>;
	onCancel?: (jobId: string) => void | Promise<void>;
}) {
	const { card } = jobStyles({
		status: job.status,
	});

	const acceptJob = useMutation(api.jobs.acceptJob);
	const rejectJob = useMutation(api.jobs.rejectJob);
	const resolveJob = useMutation(api.jobs.resolveJob);
	const cancelJob = useMutation(api.jobs.cancelJob);

	const handleAcceptJob = async () => {
		if (preview) return;
		if (onAccept) {
			await onAccept(job._id);
			return;
		}
		try {
			await acceptJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to accept job");
		}
	};

	const handleRejectJob = async () => {
		if (preview) return;
		if (onReject) {
			await onReject(job._id);
			return;
		}
		try {
			await rejectJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to release job");
		}
	};

	const handleResolveJob = async () => {
		if (preview) return;
		if (onResolve) {
			await onResolve(job._id);
			return;
		}
		try {
			await resolveJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
			toast.success("Job done!");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to mark job done");
		}
	};
	const handleCancelJob = async () => {
		if (preview) return;
		if (onCancel) {
			await onCancel(job._id);
			return;
		}
		try {
			await cancelJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to cancel job");
		}
	};

	const isCreator = job.creatorId === currentStaffId;
	const isClaimer = job.claimerId === currentStaffId;
	const isPending = job.status === "pending";
	const showCancel = (isPending && isCreator) || (isSupervisor && !isCreator);

	const { label: pendingAge, elapsedMs: pendingElapsedMs } = usePendingJobTimer(
		job._creationTime,
		isPending,
	);
	const pendingIsStale = isPending && pendingElapsedMs >= PENDING_WARN_AFTER_MS;

	const staffNameClass = (isSelf: boolean, isRevoked: boolean) => {
		if (isSelf) return "text-yellow-400 font-semibold";
		if (isRevoked) return "text-red-400 font-semibold";
		return "text-zinc-300";
	};

	return (
		<div className={card()}>
			<div className="flex flex-col">
				{/* ticket | timer | actions */}
				<div className="flex flex-row items-center gap-2 px-1.5 pt-2">
					<div className="flex min-w-0 flex-1 items-center self-start gap-2">
						{job.ticketNumber != null && (
							<div className="px-1 bg-zinc-800 rounded-xs min-w-10 flex items-center justify-center gap-1">
								<span className="text-[12px] font-semibold text-blue-200 tracking-wide">
									JOB
								</span>
								<span className="text-[12px] font-bold text-blue-200 tracking-wide">
									{job.ticketNumber}
								</span>
							</div>
						)}
						{isPending && (
							<span
								className={`text-[11px] font-mono italic tabular-nums self-start ${
									pendingIsStale ? "text-red-300" : "text-zinc-400"
								}`}
							>
								{pendingAge}
							</span>
						)}
					</div>

					<div className="flex min-w-0 flex-1 flex-row items-center justify-end gap-3">
						{showCancel && (
							<button
								className="rounded-full bg-zinc-700 p-2 text-xs font-medium text-rose-200"
								type="button"
								onClick={handleCancelJob}
							>
								<Trash size={15} className="text-rose-200" strokeWidth={2} />
							</button>
						)}
						{job.status === "pending" &&
							!isCreator &&
							!job.creatorMissing &&
							canParticipateOnFloor && (
								<button
									className="rounded-xs bg-zinc-700 p-1 px-2 text-xs font-medium text-zinc-200"
									type="button"
									onClick={handleAcceptJob}
								>
									Accept Job
								</button>
							)}
						{job.status === "pending" &&
							job.creatorMissing &&
							!isSupervisor && (
								<p className="text-[11px] italic text-red-400/90 text-right">
									Waiting for supervisor or admin to clear
								</p>
							)}
						{job.status === "accepted" && (isClaimer || isCreator) && (
							<>
								<button
									className="rounded-full bg-zinc-700 p-2 text-xs font-medium "
									type="button"
									onClick={handleRejectJob}
								>
									<Undo size={15} className="text-zinc-200" strokeWidth={2} />
								</button>
								<button
									className="rounded-full bg-zinc-700 p-2 text-xs font-medium text-zinc-200"
									type="button"
									onClick={handleResolveJob}
								>
									<Check size={15} className="text-zinc-200" strokeWidth={2} />
								</button>
							</>
						)}
					</div>
				</div>
				{/* Pax and type of person */}
				<div className="flex flex-row items-center px-2 gap-2">
					<span className="text-[15px] font-semibold text-zinc-100">
						{job.personCount} pax
					</span>
					<div className="self-center bg-zinc-500 h-0.5 w-0.5 rounded-full" />
					<span className="text-[13px] font-bold text-zinc-300">
						{capitalizeWords(job.requestType)}
					</span>
					<div className="self-center bg-zinc-500 h-0.5 w-0.5 rounded-full" />
					<span className="text-[12px]  text-zinc-300">{job.description}</span>
				</div>
			</div>
			{/* bottom half section */}
			<div className="flex flex-col items-start px-2 pb-2 gap-1">
				<div className="flex flex-row items-center leading-tight gap-1  pt-1 rounded-sm ">
					<span className="font-medium tracking-tight text-xs text-yellow-200">
						{capitalizeWords(job.originSectionName)}
					</span>
					<div className="self-center bg-zinc-300 h-0.5 w-0.5 rounded-full" />
					<span className="font-medium text-[11px] text-zinc-300">
						{job.creatorRoleTitle}
					</span>
					<div className="self-center bg-zinc-300 h-0.5 w-0.5 rounded-full" />
					<div className="flex flex-row items-center gap-1">
						<span
							className={`font-medium text-[11px] italic ${staffNameClass(false, job.creatorMissing)}`}
						>
							{job.creatorName}
						</span>
						{isCreator && (
							<span className=" bg-yellow-300 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-zinc-950">
								me
							</span>
						)}
					</div>
				</div>
				{job.status === "accepted" ? (
					<div className="flex flex-row items-center gap-1">
						{/* <CornerDownRight size={10} className="text-zinc-300" /> */}
						<div className="w-2 h-2 rounded-bl-sm border-l border-b border-zinc-300" />
						<div className="flex flex-row items-center leading-tight gap-1 px-1.5 py-1 rounded-sm bg-emerald-500/10">
							<span className="font-medium tracking-tight text-xs text-emerald-300">
								{capitalizeWords(job.destinationSectionName ?? "TBD")}
							</span>
							<div className="self-center bg-zinc-300 h-0.5 w-0.5 rounded-full" />
							<span className="font-medium text-[11px] text-zinc-300">
								{job.claimerRoleTitle}
							</span>
							<div className="self-center bg-zinc-300 h-0.5 w-0.5 rounded-full" />
							<div className="flex flex-row items-center gap-1">
								<span
									className={`font-medium text-[11px] italic ${staffNameClass(false, job.claimerMissing)}`}
								>
									{job.claimerName}
								</span>
							</div>
						</div>
						{isClaimer && (
							<span className="bg-emerald-400 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-zinc-950">
								me
							</span>
						)}
					</div>
				) : (
					<div className="flex flex-row items-center leading-tight gap-1 px-1.5 py-1">
						<span className="font-medium tracking-tight text-xs text-zinc-400 italic">
							pending acceptance...
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
