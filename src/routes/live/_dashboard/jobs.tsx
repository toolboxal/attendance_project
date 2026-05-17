import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { tv } from "tailwind-variants";
import { DispatchPanel } from "#/components/jobs/DispatchPanel";
import { JobItem } from "#/components/jobs/JobItem";
import { capitalizeWords, formatTime12h } from "#/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

const layoutStyles = tv({
	slots: {
		container: "py-2 flex flex-col gap-1.5",
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
	const { data: jobs } = useSuspenseQuery(
		convexQuery(api.jobs.getAllJobs, {
			accessToken: localStorage.getItem("asistir_staff_token") ?? "",
		}),
	);
	// console.log(jobs);

	const pendingJobs = jobs.filter((job) => job.status === "pending");
	const myJobs = jobs.filter(
		(job) => job.creatorId === profile?._id || job.claimerId === profile?._id,
	);

	const acceptJob = useMutation(api.jobs.acceptJob);

	const handleAcceptJob = async (jobId: any) => {
		try {
			await acceptJob({
				jobId: jobId,
				accessToken: localStorage.getItem("asistir_staff_token") ?? "",
			});
			toast.success("Job accepted!");
		} catch (e: any) {
			toast.error(e.message || "Failed to accept job");
		}
	};

	return (
		<div className="flex-1 flex flex-col gap-2 bg-zinc-950 pb-32">
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
			<Tabs defaultValue="pending">
				<TabsList variant={"line"}>
					<TabsTrigger value="pending">Pending Jobs</TabsTrigger>
					<TabsTrigger value="myjobs">My Jobs</TabsTrigger>
					<TabsTrigger value="all">All Jobs</TabsTrigger>
				</TabsList>
				<TabsContent value="pending">
					<div className={container()}>
						{pendingJobs.map((job) => (
							<JobItem
								key={job._id}
								job={job}
								currentStaffId={profile?._id}
								onAccept={handleAcceptJob}
							/>
						))}
					</div>
				</TabsContent>
				<TabsContent value="myjobs">
					<div className={container()}>
						{myJobs.map((job) => (
							<JobItem
								key={job._id}
								job={job}
								currentStaffId={profile?._id}
								onAccept={handleAcceptJob}
							/>
						))}
					</div>
				</TabsContent>
				<TabsContent value="all"></TabsContent>
			</Tabs>

			<DispatchPanel />
		</div>
	);
}
