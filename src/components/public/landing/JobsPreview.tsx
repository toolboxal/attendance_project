import { format } from "date-fns";
import { Check } from "lucide-react";
import { tv } from "tailwind-variants";
import { JobItem } from "#/components/jobs/JobItem";
import { PhoneMockupShell } from "#/components/public/landing/LiveFloorPreviewChrome";
import { formatStaffRoleLabel, formatTime12h } from "#/lib/utils";
import { MAX_ACTIVE_JOBS } from "../../../../convex/constants";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

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

const MOCK_CURRENT_STAFF_ID = "mock_staff_jon" as Id<"liveStaff">;

const MOCK_PROFILE = {
	sectionName: "Main Hall",
	roleTitle: "Floor Coordinator",
	name: "Toby Scott",
	role: "supervisor",
	eventDate: "2026-07-12T00:00:00.000Z",
	sectionStartTime: "09:00",
	sectionEndTime: "17:00",
};

const MOCK_JOBS: EnrichedJob[] = [
	{
		_id: "mock_job_1" as Id<"jobs">,
		_creationTime: 0,
		eventId: "mock_event" as Id<"events">,
		creatorId: "mock_staff_maria" as Id<"liveStaff">,
		claimerId: undefined,
		originSectionId: undefined,
		destinationSectionId: undefined,
		personCount: 1,
		requestType: "vip",
		description: "Speaker entourage",
		ticketNumber: 1,
		status: "pending",
		creatorName: "Maria Santos",
		creatorRole: "usher",
		creatorRoleTitle: "Usher Lead",
		claimerName: undefined,
		claimerRole: undefined,
		claimerRoleTitle: "",
		originSectionName: "gate a",
		destinationSectionName: undefined,
		creatorMissing: false,
		claimerMissing: false,
	},
	{
		_id: "mock_job_2" as Id<"jobs">,
		_creationTime: 0,
		eventId: "mock_event" as Id<"events">,
		creatorId: "mock_staff_james" as Id<"liveStaff">,
		claimerId: MOCK_CURRENT_STAFF_ID,
		originSectionId: undefined,
		destinationSectionId: undefined,
		personCount: 1,
		requestType: "wheelchair",
		description: "Needs ramp access",
		ticketNumber: 2,
		status: "accepted",
		creatorName: "James Wu",
		creatorRole: "usher",
		creatorRoleTitle: "Section Usher",
		claimerName: "Toby Scott",
		claimerRole: "supervisor",
		claimerRoleTitle: "Floor Coordinator",
		originSectionName: "lobby",
		destinationSectionName: "Main Hall",
		creatorMissing: false,
		claimerMissing: false,
	},
	{
		_id: "mock_job_3" as Id<"jobs">,
		_creationTime: 0,
		eventId: "mock_event" as Id<"events">,
		creatorId: MOCK_CURRENT_STAFF_ID,
		claimerId: undefined,
		originSectionId: undefined,
		destinationSectionId: undefined,
		personCount: 4,
		requestType: "family",
		description: "Late arrivals",
		ticketNumber: 3,
		status: "pending",
		creatorName: "Toby Scott",
		creatorRole: "supervisor",
		creatorRoleTitle: "Floor Coordinator",
		claimerName: undefined,
		claimerRole: undefined,
		claimerRoleTitle: "",
		originSectionName: "main hall",
		destinationSectionName: undefined,
		creatorMissing: false,
		claimerMissing: false,
	},
];

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 pb-2 min-h-0",
	},
});

export function JobsPreview() {
	const { container } = layoutStyles();
	const activeJobs = MOCK_JOBS;
	const relevantJobs = activeJobs.filter(
		(job) =>
			(job.creatorId === MOCK_CURRENT_STAFF_ID ||
				job.claimerId === MOCK_CURRENT_STAFF_ID) &&
			job.status === "accepted",
	);

	return (
		<section className="spine py-16 md:py-24 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-backwards">
			<div className="flex flex-col md:flex-row gap-10 md:gap-12 items-start px-2 md:px-10">
				<div className="flex-1 max-w-xl text-left mt-8">
					<h2 className="text-3xl md:text-4xl font-heading text-zinc-100 tracking-tight leading-tight">
						Create jobs to coordinate human traffic
					</h2>
					<p className="text-lg text-zinc-400 pt-4 font-light leading-relaxed">
						Clear directions on a rapidly moving floor. Mobile first UI for busy
						event staff that need to stay on their feet.
					</p>
				</div>
				<PhoneMockupShell heightClass="h-[480px]">
					{relevantJobs.length > 0 ? (
						<div className="flex flex-col gap-1.5 rounded-md p-1 shrink-0">
							{relevantJobs.map((relevantJob) => {
								const isCreator = relevantJob.creatorId === MOCK_CURRENT_STAFF_ID;
								const message = isCreator
									? `${relevantJob.claimerName ?? "Someone"} accepted your Job ${relevantJob.ticketNumber}`
									: `You accepted Job ${relevantJob.ticketNumber}`;

								return (
									<div
										className="flex flex-col rounded-sm bg-zinc-950 px-2.5 py-2 shadow-sm shadow-zinc-600"
										key={relevantJob._id}
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
						<div className="flex flex-col gap-4 shrink-0">
							<div className="flex flex-row items-start justify-between">
								<div className="flex flex-col">
									<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
										{MOCK_PROFILE.sectionName.toUpperCase()}
									</p>
									<p className="text-xs font-extrabold text-zinc-300 tracking-tight">
										{MOCK_PROFILE.roleTitle}
									</p>
									<div className="flex flex-row items-center gap-1">
										<p className="text-xs font-extrabold text-zinc-300 tracking-tight italic">
											{MOCK_PROFILE.name}
										</p>
										<p className="text-xs font-extrabold text-zinc-300 tracking-tight italic">
											{formatStaffRoleLabel(MOCK_PROFILE.role)}
										</p>
									</div>
								</div>
								<div className="flex flex-col">
									<span className="self-end text-xs font-semibold text-zinc-200">
										{format(new Date(MOCK_PROFILE.eventDate), "PPPP")}
									</span>
									<span className="self-end font-mono text-xs text-yellow-200">
										{formatTime12h(MOCK_PROFILE.sectionStartTime)}
										{` - ${formatTime12h(MOCK_PROFILE.sectionEndTime)}`}
									</span>
								</div>
							</div>
						</div>
					)}

					<div className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800 mt-2 shrink-0">
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

					<div className="relative flex-1 min-h-0">
						<div className={container()}>
							{activeJobs.map((job) => (
								<JobItem
									key={job._id}
									job={job}
									currentStaffId={MOCK_CURRENT_STAFF_ID}
									isSupervisor
									canParticipateOnFloor
									preview
								/>
							))}
						</div>
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10" />
					</div>
				</PhoneMockupShell>
			</div>
		</section>
	);
}
