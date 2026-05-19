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
};

const jobStyles = tv({
	slots: {
		card: "bg-zinc-700 rounded-md overflow-hidden text-zinc-100 ",
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
				bottomSection: "bg-green-800 text-zinc-50 rounded-b-md px-2 py-1",
			},
			resolved: {
				card: "bg-zinc-950 opacity-40",
				// bottomSection: "bg-blue-800 text-zinc-50 rounded-b-md px-2 py-1",
			},
		},
	},
});

export function JobItem({
	job,
	currentStaffId,
}: {
	job: EnrichedJob;
	currentStaffId?: string;
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
			toast.error(e instanceof Error ? e.message : "Failed to resolve job");
		}
	};

	return (
		// <div className={card()}>
		// 	<div className={header()}>
		// 		<div className="flex flex-col items-start">
		// 			<span className="font-semibold tracking-tight text-[13px]">
		// 				{capitalizeWords(job.originSectionName)}
		// 			</span>
		// 			<span className="font-medium text-[10px]">
		// 				{job.creatorRoleTitle}
		// 			</span>
		// 		</div>
		// 		<div className="flex flex-row items-center gap-2">
		// 			<div className="flex flex-col items-end">
		// 				<span className="font-semibold tracking-tight text-[13px]">
		// 					{job.creatorName}
		// 				</span>

		// 				<span className="font-medium text-[10px]">{job.creatorRole}</span>
		// 			</div>
		// 			<div
		// 				className={`p-1.5 px-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
		// 					job.status === "pending"
		// 						? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
		// 						: job.status === "accepted"
		// 							? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
		// 							: "bg-blue-400/20 text-blue-100 border-blue-400"
		// 				}`}
		// 			>
		// 				{job.status}
		// 			</div>
		// 		</div>
		// 	</div>
		// 	<div className={middleSection()}>
		// 		<div className="pl-1 flex items-center gap-6">
		// 			<div className="flex items-center gap-2">
		// 				<span className="text-lg"> {job.personCount}</span>
		// 				<span className="font-light">pax</span>
		// 			</div>
		// 			<span className="font-light text-xs">{job.description}</span>
		// 		</div>
		// 		<div className=" p-1  rounded-xs flex items-center justify-center ">
		// 			<span className="text-xs font-mono text-yellow-300 uppercase tracking-wider">
		// 				{capitalizeWords(job.requestType)}
		// 			</span>
		// 		</div>
		// 	</div>
		// 	<div className={bottomSection()}>
		// 		<div className="flex flex-row items-center justify-between flex-1">
		// 			<div className="flex flex-col items-start">
		// 				<span className="font-semibold tracking-tight text-[13px]">
		// 					{capitalizeWords(job.destinationSectionName ?? "")}
		// 				</span>
		// 				<span className="font-medium text-[10px]">
		// 					{job.claimerRoleTitle}
		// 				</span>
		// 			</div>
		// 			<div className="flex flex-col items-end">
		// 				<span className="font-semibold tracking-tight text-[13px]">
		// 					{job.claimerName}
		// 				</span>
		// 				<span className="font-medium text-[10px]">{job.claimerRole}</span>
		// 			</div>
		// 		</div>
		// 		{job.status === "pending" && job.creatorId === currentStaffId && (
		// 			<div className="flex flex-row items-center gap-1.5 ml-auto">
		// 				<button
		// 					className="p-1 px-2 bg-red-800  text-zinc-50 text-sm font-semibold rounded-md"
		// 					type="button"
		// 					onClick={handleCancelJob}
		// 				>
		// 					Cancel
		// 				</button>
		// 			</div>
		// 		)}
		// 		{job.status === "pending" && job.creatorId !== currentStaffId && (
		// 			<button
		// 				className="p-1 px-2 bg-zinc-500 text-zinc-50 text-sm font-semibold rounded-md ml-auto"
		// 				type="button"
		// 				onClick={handleAcceptJob}
		// 			>
		// 				Accept Job
		// 			</button>
		// 		)}

		// 		{job.status === "accepted" && job.claimerId === currentStaffId && (
		// 			<div className="flex flex-row items-center gap-1.5 ml-auto">
		// 				<button
		// 					className="p-1 px-2 bg-zinc-50 text-zinc-950 text-sm font-semibold rounded-md"
		// 					type="button"
		// 					onClick={handleRejectJob}
		// 				>
		// 					Reject
		// 				</button>
		// 				<button
		// 					className="p-1 px-2 bg-zinc-50 text-zinc-950 text-sm font-semibold rounded-md"
		// 					type="button"
		// 					onClick={handleResolveJob}
		// 				>
		// 					Resolve
		// 				</button>
		// 			</div>
		// 		)}
		// 	</div>
		// </div>
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
							className={`font-medium text-[11px] italic ${job.creatorId === currentStaffId ? "text-yellow-400 font-semibold " : "text-zinc-300"}`}
						>
							{job.creatorName}
						</span>
						<span
							className={`font-medium text-[11px] italic relative ${job.creatorId === currentStaffId ? "text-yellow-400 font-semibold " : "text-zinc-300"}`}
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
						<MoveRight size={24} strokeWidth={1.5} className="text-green-400" />
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
								className={`font-medium text-[11px] italic ${job.claimerId === currentStaffId ? "text-yellow-400 font-semibold" : "text-zinc-300"}`}
							>
								{job.claimerName}
							</span>
							<span
								className={`font-medium text-[11px] italic relative ${job.claimerId === currentStaffId ? "text-yellow-400 font-semibold" : "text-zinc-300"}`}
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
				<span className="text-[13px] italic ">{job.description}</span>
			</div>
			<div className="flex flex-row items-center justify-between px-2 py-0.5">
				{job.status === "pending" && job.creatorId !== currentStaffId && (
					<button
						className="p-1 px-2 bg-zinc-200 text-zinc-950 text-xs font-medium rounded-sm ml-auto"
						type="button"
						onClick={handleAcceptJob}
					>
						Accept Job
					</button>
				)}
				{job.status === "pending" && job.creatorId === currentStaffId && (
					<div className="flex flex-row items-center gap-1.5 ml-auto">
						<button
							className="p-1 px-2 bg-red-300 text-zinc-950 text-xs font-medium rounded-sm ml-auto"
							type="button"
							onClick={handleCancelJob}
						>
							Cancel
						</button>
					</div>
				)}
				{/* Both creator and accepter can reject and resolve */}
				{job.status === "accepted" &&
					(job.claimerId === currentStaffId ||
						job.creatorId === currentStaffId) && (
						<div className="flex flex-row items-center gap-1.5 ml-auto">
							<button
								className="p-1 px-2 bg-zinc-200 text-zinc-950 text-xs font-medium rounded-sm ml-auto"
								type="button"
								onClick={handleRejectJob}
							>
								Reject
							</button>
							<button
								className="p-1 px-2 bg-zinc-200 text-zinc-950 text-xs font-medium rounded-sm ml-auto"
								type="button"
								onClick={handleResolveJob}
							>
								Resolve
							</button>
						</div>
					)}
			</div>
		</div>
	);
}
