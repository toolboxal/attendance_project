import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

export function JobAcceptanceToasts({ accessToken }: { accessToken: string }) {
	const profile = useQuery(api.liveStaff.getProfile, { accessToken });
	const activeJobs = useQuery(api.jobs.getActiveJobs, { accessToken });
	const notifiedJobIds = useRef<Set<string>>(new Set());
	const isInitialized = useRef(false);

	useEffect(() => {
		if (!profile?._id || activeJobs === undefined) return;

		const currentStaffId = profile._id;

		if (!isInitialized.current) {
			for (const job of activeJobs) {
				if (job.status === "accepted" && job.creatorId === currentStaffId) {
					notifiedJobIds.current.add(job._id);
				}
			}
			isInitialized.current = true;
			return;
		}

		for (const job of activeJobs) {
			if (job.creatorId !== currentStaffId) continue;

			if (job.status === "accepted" && !notifiedJobIds.current.has(job._id)) {
				notifiedJobIds.current.add(job._id);
				toast.success(
					`${job.claimerName ?? "Someone"} accepted your job`,
				);
			} else if (
				job.status !== "accepted" &&
				notifiedJobIds.current.has(job._id)
			) {
				notifiedJobIds.current.delete(job._id);
			}
		}
	}, [activeJobs, profile?._id]);

	return null;
}
