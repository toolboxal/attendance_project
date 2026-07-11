import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { DemoJob } from "./types";

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

export function demoJobToEnriched(job: DemoJob): EnrichedJob {
	return {
		_id: job.id as Id<"jobs">,
		_creationTime: 0,
		eventId: "demo_event" as Id<"events">,
		creatorId: job.creatorId as Id<"liveStaff">,
		claimerId: job.claimerId as Id<"liveStaff"> | undefined,
		originSectionId: undefined,
		destinationSectionId: undefined,
		personCount: job.personCount,
		requestType: job.requestType,
		description: job.description,
		ticketNumber: job.ticketNumber,
		status: job.status,
		creatorName: job.creatorName,
		creatorRole: job.creatorRole,
		creatorRoleTitle: job.creatorRoleTitle,
		claimerName: job.claimerName,
		claimerRole: job.claimerRole,
		claimerRoleTitle: job.claimerRoleTitle,
		originSectionName: job.originSectionName,
		destinationSectionName: job.destinationSectionName,
		creatorMissing: job.creatorMissing,
		claimerMissing: job.claimerMissing,
	};
}
