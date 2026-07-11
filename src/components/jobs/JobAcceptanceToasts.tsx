import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

/** Job ids where the creator released the job themselves — skip the release toast. */
export const suppressCreatorReleaseToastIds = new Set<string>();

type TrackedAcceptedJob = {
	claimerName: string;
	ticketNumber: number | undefined;
};

export function JobAcceptanceToasts({ accessToken }: { accessToken: string }) {
	const profile = useQuery(api.liveStaff.getProfile, { accessToken });
	const activeJobs = useQuery(api.jobs.getActiveJobs, { accessToken });
	const acceptedByCreator = useRef<Map<string, TrackedAcceptedJob>>(new Map());
	const isInitialized = useRef(false);

	useEffect(() => {
		if (!profile?._id || activeJobs === undefined) return;

		const currentStaffId = profile._id;
		const nextAccepted = new Map<string, TrackedAcceptedJob>();

		for (const job of activeJobs) {
			if (job.creatorId !== currentStaffId || job.status !== "accepted") {
				continue;
			}
			nextAccepted.set(job._id, {
				claimerName: job.claimerName ?? "Someone",
				ticketNumber: job.ticketNumber,
			});
		}

		if (!isInitialized.current) {
			acceptedByCreator.current = nextAccepted;
			isInitialized.current = true;
			return;
		}

		for (const [jobId, prev] of acceptedByCreator.current) {
			if (nextAccepted.has(jobId)) continue;

			const stillActive = activeJobs.find((job) => job._id === jobId);
			const wasReleased = stillActive?.status === "pending";

			if (suppressCreatorReleaseToastIds.has(jobId)) {
				suppressCreatorReleaseToastIds.delete(jobId);
			} else if (wasReleased) {
				const jobLabel =
					prev.ticketNumber != null ? `Job #${prev.ticketNumber}` : "job";
				toast.message(`${prev.claimerName} cannot fulfill your ${jobLabel}`, {
					classNames: {
						toast: "!bg-rose-300 !text-zinc-950",
						title: "!text-zinc-950",
					},
				});
			}
		}

		for (const [jobId, tracked] of nextAccepted) {
			if (!acceptedByCreator.current.has(jobId)) {
				toast.success(`${tracked.claimerName} accepted your job`);
			}
		}

		acceptedByCreator.current = nextAccepted;
	}, [activeJobs, profile?._id]);

	return null;
}
