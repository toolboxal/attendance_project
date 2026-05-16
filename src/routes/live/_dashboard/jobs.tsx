import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState } from "react";
import { tv } from "tailwind-variants";
import { DispatchPanel } from "#/components/jobs/DispatchPanel";
import { capitalizeWords, formatTime12h } from "#/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../../convex/_generated/api";

const jobComponent = tv({
	slots: {
		container: "py-2",
		card: "bg-zinc-800 rounded-md overflow-hidden text-zinc-100 py-0.5",
		header:
			" p-1 px-3  flex flex-row items-center justify-between font-normal ",
		middleSection:
			" flex flex-row items-center gap-5 p-1 px-3 text-sm font-normal font-bold justify-between",
		bottomSection:
			" flex flex-row items-center gap-5 p-1 px-3 text-sm font-normal font-bold justify-between",
	},
	variants: {
		status: {
			pending: "",
			accepted: "",
			resolved: "",
		},
	},
});

export const Route = createFileRoute("/live/_dashboard/jobs")({
	component: JobsTabComponent,
});

function JobsTabComponent() {
	const { container, card, header, middleSection, bottomSection } =
		jobComponent();

	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, {
			accessToken: localStorage.getItem("asistir_staff_token") ?? "",
		}),
	);
	const { data: jobs } = useSuspenseQuery(
		convexQuery(api.jobs.getAllJobs, {
			accessToken: localStorage.getItem("asistir_staff_token") ?? "",
		}),
	);
	console.log(jobs);

	const pendingJobs = jobs.filter((job) => job.status === "pending");
	const myJobs = jobs.filter(
		(job) => job.creatorId === profile?._id || job.claimerId === profile?._id,
	);

	return (
		<div className="flex flex-col gap-6 bg-zinc-950 pb-32">
			{/* Header Area */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-row items-start justify-between">
					<div className="flex flex-col">
						<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
							{profile?.sectionName.toUpperCase()}
						</p>
						<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
							{profile?.roleTitle}
						</p>
						<p className="text-xs font-extrabold text-zinc-400 tracking-tight">
							{profile?.role}
						</p>
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
			<Tabs>
				<TabsList variant={"line"} defaultValue="pending">
					<TabsTrigger value="pending">Pending Jobs</TabsTrigger>
					<TabsTrigger value="myjobs">My Jobs</TabsTrigger>
					<TabsTrigger value="all">All Jobs</TabsTrigger>
				</TabsList>
				<TabsContent value="pending">
					<div className={container()}>
						{pendingJobs.map((job) => (
							<div key={job._id} className={card()}>
								<div className={header()}>
									<div className="flex flex-col items-start">
										<span className="font-semibold tracking-tight text-sm">
											{capitalizeWords(job.originSectionName)}
										</span>
										<span className="font-medium text-[10px] italic">
											{job.creatorRoleTitle}
										</span>
									</div>
									<div className="flex flex-col items-end">
										<span className="font-semibold tracking-tight text-sm">
											{job.creatorName}
										</span>

										<span className="font-medium text-[10px] italic">
											{job.creatorRole}
										</span>
									</div>
								</div>
								<div className={middleSection()}>
									<div className="pl-1 flex items-center gap-10">
										<div className="flex items-center gap-2">
											<span className="text-lg"> {job.personCount}</span>
											<span className="font-light">pax</span>
										</div>
										<span className="font-light text-xs">
											{job.description}
										</span>
									</div>
									<div className=" p-1 bg-blue-300 rounded-sm flex items-center justify-center">
										<span className="text-[11px] font-normal text-zinc-950">
											{capitalizeWords(job.requestType)}
										</span>
									</div>
								</div>
								<div className={bottomSection()}>
									<div className=" p-1 bg-yellow-300/50 rounded-sm flex items-center justify-center">
										<span className="text-[10px] font-medium uppercase">
											{job.status}
										</span>
									</div>
									<button
										className="p-1 px-2 bg-zinc-50 text-zinc-950 text-sm font-semibold rounded-sm"
										type="button"
									>
										Take this Job
									</button>
								</div>
							</div>
						))}
					</div>
				</TabsContent>
				<TabsContent value="myjobs"></TabsContent>
				<TabsContent value="all"></TabsContent>
			</Tabs>

			<DispatchPanel />
		</div>
	);
}
