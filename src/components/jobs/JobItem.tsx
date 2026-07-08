import { useMutation } from "convex/react";
import { MoveRight } from "lucide-react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { capitalizeWords, formatStaffRoleLabel } from "#/lib/utils";
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
			" py-0.5 px-2  flex flex-row items-center justify-between font-normal",
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
	canParticipateOnFloor = true,
	preview = false,
}: {
	job: EnrichedJob;
	currentStaffId?: string;
	isSupervisor?: boolean;
	canParticipateOnFloor?: boolean;
	preview?: boolean;
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
	const showCancel =
		(job.status === "pending" && isCreator) || (isSupervisor && !isCreator);

	const staffNameClass = (isSelf: boolean, isRevoked: boolean) => {
		if (isSelf) return "text-yellow-400 font-semibold";
		if (isRevoked) return "text-red-400 font-semibold";
		return "text-zinc-300";
	};

	return (
		<div className={card()}>
			<div className="flex flex-row items-center justify-between px-2 py-0.5 border-b border-zinc-600">
				<div
					className={`flex flex-col leading-tight ${isCreator ? "text-yellow-400" : ""}`}
				>
					<span
						className={`font-medium tracking-tight text-[13px] ${isCreator ? "" : "text-zinc-50"}`}
					>
						{capitalizeWords(job.originSectionName)}
					</span>
					<span
						className={`font-medium text-xs ${isCreator ? "" : "text-zinc-300"}`}
					>
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
							{formatStaffRoleLabel(job.creatorRole)}
						</span>
						{/* {isCreator && (
							<span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
						)} */}
					</div>
				</div>
				{job.status === "pending" && (
					<div className="self-start flex items-center justify-center p-1rounded-sm mt-1">
						<span className="text-[11px] font-bold text-zinc-400 uppercase">
							{/* {job.status} */}
							OPEN JOB
						</span>
					</div>
				)}
				{job.status === "accepted" && (
					<div className="flex flex-col items-center">
						<span className="text-[11px] font-bold text-green-400 uppercase">
							{job.status} BY
						</span>

						{isClaimer ? (
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
					<div
						className={`flex flex-col leading-tight items-end ${isClaimer ? "text-yellow-400" : ""}`}
					>
						<span
							className={`font-medium tracking-tight text-[13px] ${isClaimer ? "" : "text-zinc-50"}`}
						>
							{capitalizeWords(job.destinationSectionName ?? "TBD")}
						</span>
						<span
							className={`font-medium text-xs ${isClaimer ? "" : "text-zinc-300"}`}
						>
							{job.claimerRoleTitle}
						</span>
						<div className="flex flex-row items-center gap-1">
							{/* {isClaimer && (
								<span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
							)} */}
							<span
								className={`font-medium text-[11px] italic ${staffNameClass(isClaimer, job.claimerMissing)}`}
							>
								{job.claimerName}
							</span>
							<span
								className={`relative font-medium text-[11px] italic ${staffNameClass(isClaimer, job.claimerMissing)}`}
							>
								{formatStaffRoleLabel(job.claimerRole)}
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
					{showCancel && (
						<button
							className="rounded-sm bg-red-300 p-1 px-2 text-xs font-medium text-zinc-950"
							type="button"
							onClick={handleCancelJob}
						>
							Cancel
						</button>
					)}
					{job.status === "pending" &&
						!isCreator &&
						!job.creatorMissing &&
						canParticipateOnFloor && (
							<button
								className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950"
								type="button"
								onClick={handleAcceptJob}
							>
								Accept Job
							</button>
						)}
					{job.status === "pending" && job.creatorMissing && !isSupervisor && (
						<p className="text-[11px] italic text-red-400/90">
							Waiting for supervisor or admin to clear
						</p>
					)}
					{job.status === "accepted" && (isClaimer || isCreator) && (
						<>
							<button
								className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950"
								type="button"
								onClick={handleRejectJob}
							>
								Release
							</button>
							<button
								className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950"
								type="button"
								onClick={handleResolveJob}
							>
								Completed
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
