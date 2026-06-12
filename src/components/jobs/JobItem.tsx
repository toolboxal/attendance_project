import { useMutation } from "convex/react";
import { MoveRight } from "lucide-react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { capitalizeWords } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

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
		card: "bg-zinc-700 rounded-md overflow-hidden text-zinc-100 pb-0.5",
		header:
			" py-0.5 px-2  flex flex-row items-center justify-between font-normal ",
		middleSection:
			" flex flex-row items-center gap-5  px-1.5 text-sm font-normal font-bold justify-between",
		bottomSection:
			" flex flex-row items-center gap-2 p-0.5 px-2 text-sm font-normal font-bold",
	},
	variants: {
		status: {
			pending: "",
			accepted: {
				card: "bg-emerald-700/50 ",
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
}: {
	job: EnrichedJob;
	currentStaffId?: string;
	isSupervisor?: boolean;
}) {
	const { card } = jobStyles({
		status: job.status,
	});

	const acceptJob = useMutation(api.jobs.acceptJob);
	const rejectJob = useMutation(api.jobs.rejectJob);
	const resolveJob = useMutation(api.jobs.resolveJob);
	const cancelJob = useMutation(api.jobs.cancelJob);

	const handleAcceptJob = async () => {
		try {
			await acceptJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
			toast.success("Job accepted!");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to accept job");
		}
	};

	const handleRejectJob = async () => {
		try {
			await rejectJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
			toast.success("Job rejected!");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to reject job");
		}
	};

	const handleResolveJob = async () => {
		try {
			await resolveJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
			toast.success("Job resolved!");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to resolve job");
		}
	};
	const handleCancelJob = async () => {
		try {
			await cancelJob({
				jobId: job._id,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
			toast.success("Job cancelled!");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to cancel job");
		}
	};

	const isCreator = job.creatorId === currentStaffId;
	const showCreatorCancel = job.status === "pending" && isCreator;
	const showSupervisorCancel = isSupervisor;

	const staffNameClass = (isSelf: boolean, isRevoked: boolean) => {
		if (isSelf) return "text-yellow-400 font-semibold";
		if (isRevoked) return "text-red-400 font-semibold";
		return "text-zinc-300";
	};

	return (
		<div className={card()}>
			<div className="flex flex-row items-center justify-between px-2 py-0.5 border-b border-zinc-600">
				<div className="flex flex-col leading-tight">
					<span className="font-medium text-zinc-50 tracking-tight text-sm">
						{capitalizeWords(job.originSectionName)}
					</span>
					<span className="font-medium text-zinc-300 text-xs">
						{job.creatorRoleTitle}
					</span>
					<div className="flex flex-row items-center gap-1 ">
						<span
							className={`font-medium text-[11px] italic ${staffNameClass(isCreator, job.creatorMissing)}`}
						>
							{job.creatorName}
						</span>
						<span
							className={`relative font-medium text-[11px] italic ${staffNameClass(isCreator, job.creatorMissing)}`}
						>
							{job.creatorRole}
						</span>
						{job.creatorId === currentStaffId && (
							<span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
						)}
					</div>
				</div>
				{job.status === "pending" && (
					<div className="self-start flex items-center justify-center p-1rounded-sm mt-1">
						<span className="text-[11px] font-bold text-yellow-400 uppercase">
							{job.status}
						</span>
					</div>
				)}
				{job.status === "accepted" && (
					<div className="flex flex-col items-center">
						<span className="text-[11px] font-bold text-green-400 uppercase">
							{job.status} BY
						</span>

						{job.claimerId === currentStaffId ? (
							<span className="text-[11px] font-bold text-green-400 uppercase">
								ME
							</span>
						) : (
							<MoveRight
								size={22}
								strokeWidth={1.5}
								className="text-green-400"
							/>
						)}
					</div>
				)}
				{job.status === "accepted" && (
					<div className="flex flex-col leading-tight items-end">
						<span className="font-medium text-zinc-50 tracking-tight text-sm">
							{capitalizeWords(job.destinationSectionName ?? "TBD")}
						</span>
						<span className="font-medium text-zinc-300 text-xs">
							{job.claimerRoleTitle}
						</span>
						<div className="flex flex-row items-center gap-1">
							{job.claimerId === currentStaffId && (
								<span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
							)}
							<span
								className={`font-medium text-[11px] italic ${staffNameClass(job.claimerId === currentStaffId, job.claimerMissing)}`}
							>
								{job.claimerName}
							</span>
							<span
								className={`relative font-medium text-[11px] italic ${staffNameClass(job.claimerId === currentStaffId, job.claimerMissing)}`}
							>
								{job.claimerRole}
							</span>
						</div>
					</div>
				)}
			</div>
			<div className="flex flex-row items-center px-2 py-0.5 gap-3">
				<span className="text-sm font-black pl-1">{job.personCount} pax</span>
				<span className="text-[13px] font-bold text-yellow-100 uppercase">
					{job.requestType}
				</span>
				<span className="text-[12px] italic ">{job.description}</span>
			</div>
			<div className="flex flex-row items-center justify-between px-2 py-0.5">
				<div className="ml-auto flex flex-row items-center gap-1.5">
					{(showCreatorCancel ||
						(showSupervisorCancel && job.status !== "accepted")) && (
						<button
							className="rounded-sm bg-red-300 p-1 px-2 text-xs font-medium text-zinc-950"
							type="button"
							onClick={handleCancelJob}
						>
							Cancel
						</button>
					)}
					{job.status === "pending" && !isCreator && !job.creatorMissing && (
						<button
							className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950"
							type="button"
							onClick={handleAcceptJob}
						>
							Accept Job
						</button>
					)}
					{job.status === "pending" &&
						job.creatorMissing &&
						!showSupervisorCancel && (
							<p className="text-[11px] italic text-red-400/90">
								Waiting for supervisor or admin to clear
							</p>
						)}
					{job.status === "accepted" &&
						(job.claimerId === currentStaffId || isCreator) && (
							<>
								<button
									className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950"
									type="button"
									onClick={handleRejectJob}
								>
									Reject
								</button>
								<button
									className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950"
									type="button"
									onClick={handleResolveJob}
								>
									Resolve
								</button>
							</>
						)}
				</div>
			</div>
		</div>
	);
}
