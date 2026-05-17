import { tv } from "tailwind-variants";
import { capitalizeWords } from "#/lib/utils";

const jobStyles = tv({
	slots: {
		card: "bg-zinc-800 rounded-md overflow-hidden text-zinc-100 py-0.5",
		header:
			" py-0.5 px-2  flex flex-row items-center justify-between font-normal ",
		middleSection:
			" flex flex-row items-center gap-5 p-0.5 px-2 text-sm font-normal font-bold justify-between",
		bottomSection:
			" flex flex-row items-center gap-2 p-0.5 px-2 text-sm font-normal font-bold",
	},
	variants: {
		status: {
			pending: "",
			accepted: {
				bottomSection: "bg-blue-700 text-zinc-50 rounded-md px-2 py-1",
			},
			resolved: "",
		},
	},
});

export function JobItem({
	job,
	currentStaffId,
	onAccept,
}: {
	job: any;
	currentStaffId?: string;
	onAccept: (id: string) => void;
}) {
	const { card, header, middleSection, bottomSection } = jobStyles({
		status: job.status,
	});

	return (
		<div className={card()}>
			<div className={header()}>
				<div className="flex flex-col items-start">
					<span className="font-semibold tracking-tight text-sm">
						{capitalizeWords(job.originSectionName)}
					</span>
					<span className="font-medium text-[10px]">
						{job.creatorRoleTitle}
					</span>
				</div>
				<div className="flex flex-row items-center gap-2">
					<div className="flex flex-col items-end">
						<span className="font-semibold tracking-tight text-sm">
							{job.creatorName}
						</span>

						<span className="font-medium text-[10px]">{job.creatorRole}</span>
					</div>
					<div
						className={`p-1.5 px-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
							job.status === "pending"
								? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
								: job.status === "accepted"
									? "bg-blue-400/20 text-blue-100 border-blue-400"
									: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
						}`}
					>
						{job.status}
					</div>
				</div>
			</div>
			<div className={middleSection()}>
				<div className="pl-1 flex items-center gap-6">
					<div className="flex items-center gap-2">
						<span className="text-lg"> {job.personCount}</span>
						<span className="font-light">pax</span>
					</div>
					<span className="font-light text-xs">{job.description}</span>
				</div>
				<div className=" p-1  rounded-xs flex items-center justify-center ">
					<span className="text-xs font-mono text-yellow-300 uppercase tracking-wider">
						{capitalizeWords(job.requestType)}
					</span>
				</div>
			</div>
			<div className={bottomSection()}>
				<div className="flex flex-row items-center justify-between flex-1">
					<div className="flex flex-col items-start">
						<span className="font-semibold tracking-tight text-sm">
							{capitalizeWords(job.destinationSectionName)}
						</span>
						<span className="font-medium text-[10px]">
							{job.claimerRoleTitle}
						</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="font-semibold tracking-tight text-sm">
							{job.claimerName}
						</span>

						<span className="font-medium text-[10px]">{job.claimerRole}</span>
					</div>
				</div>
				{job.status === "pending" && (
					<button
						className="p-1 px-2 bg-zinc-50 text-zinc-950 text-sm font-semibold rounded-lg ml-auto"
						type="button"
						onClick={() => onAccept(job._id)}
					>
						Accept Job
					</button>
				)}

				{job.status === "accepted" && job.claimerId === currentStaffId && (
					<div className="flex flex-row items-center gap-1.5 ml-auto">
						<button
							className="p-1 px-2 bg-zinc-50 text-zinc-950 text-sm font-semibold rounded-lg"
							type="button"
							onClick={() => onAccept(job._id)}
						>
							Reject
						</button>
						<button
							className="p-1 px-2 bg-zinc-50 text-zinc-950 text-sm font-semibold rounded-lg"
							type="button"
							onClick={() => onAccept(job._id)}
						>
							Resolve
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
