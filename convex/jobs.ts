import { v } from "convex/values";
import { MAX_ACTIVE_JOBS, MAX_JOB_DESCRIPTION_LENGTH } from "./constants";
import { mutation, query } from "./_generated/server";
import { getLiveContext } from "./liveAuth";

function validateJobDescription(description: string | undefined): string | undefined {
	if (description === undefined) return undefined;
	const trimmed = description.trim();
	if (trimmed.length === 0) return undefined;
	if (trimmed.length > MAX_JOB_DESCRIPTION_LENGTH) {
		throw new Error(
			`Note must be at most ${MAX_JOB_DESCRIPTION_LENGTH} characters.`,
		);
	}
	return trimmed;
}

// Retrieve active (pending and accepted) jobs for a specific event
export const getActiveJobs = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return [];

		const { staff } = live;

		// Query unresolved jobs for this event
		const jobs = await ctx.db
			.query("jobs")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.filter((q) => q.neq(q.field("status"), "resolved"))
			.order("desc")
			.take(MAX_ACTIVE_JOBS);

		// Enrich jobs with human-readable names
		const enrichedJobs = await Promise.all(
			jobs.map(async (job) => {
				const creator = await ctx.db.get(job.creatorId);
				const claimer = job.claimerId ? await ctx.db.get(job.claimerId) : null;

				const creatorRoleSlot = creator
					? await ctx.db
							.query("roleSlots")
							.withIndex("by_assignedStaff", (q) =>
								q.eq("assignedStaffId", creator._id),
							)
							.first()
					: null;

				const claimerRoleSlot = claimer
					? await ctx.db
							.query("roleSlots")
							.withIndex("by_assignedStaff", (q) =>
								q.eq("assignedStaffId", claimer._id),
							)
							.first()
					: null;

				const originSection = job.originSectionId
					? await ctx.db.get(job.originSectionId)
					: null;
				const destinationSection = job.destinationSectionId
					? await ctx.db.get(job.destinationSectionId)
					: null;

				return {
					...job,
					creatorName: creator?.staffName || "Unknown Staff",
					creatorRole: creatorRoleSlot?.role || creator?.role,
					creatorRoleTitle: creator?.adminUserId
						? "Event Admin"
						: creatorRoleSlot?.title || "",
					claimerName: claimer?.staffName,
					claimerRole: claimerRoleSlot?.role || claimer?.role,
					claimerRoleTitle: claimer?.adminUserId
						? "Event Admin"
						: claimerRoleSlot?.title || "",
					originSectionName: originSection?.name || "Unknown Gate",
					destinationSectionName: destinationSection?.name,
				};
			}),
		);

		// Sort jobs so that pending jobs always appear on top, followed by accepted.
		const statusOrder: Record<string, number> = { pending: 1, accepted: 2 };
		enrichedJobs.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

		return enrichedJobs;
	},
});

// Dispatch a new job from the Gate Controller
export const dispatchJob = mutation({
	args: {
		accessToken: v.string(),
		personCount: v.number(),
		requestType: v.string(),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const { staff } = live;

		const activeJobs = await ctx.db
			.query("jobs")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.filter((q) => q.neq(q.field("status"), "resolved"))
			.collect();

		if (activeJobs.length >= MAX_ACTIVE_JOBS) {
			throw new Error(
				`Active job limit reached (max ${MAX_ACTIVE_JOBS}). Please wait for current jobs to be accepted and resolved.`,
			);
		}

		const jobId = await ctx.db.insert("jobs", {
			eventId: staff.eventId,
			creatorId: staff._id,
			originSectionId: staff.sectionId,
			personCount: args.personCount,
			requestType: args.requestType,
			description: validateJobDescription(args.description),
			status: "pending",
			createdAt: Date.now(),
		});

		return jobId;
	},
});

// Accept a pending job
export const acceptJob = mutation({
	args: {
		accessToken: v.string(),
		jobId: v.id("jobs"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const { staff } = live;

		const job = await ctx.db.get(args.jobId);
		if (!job) throw new Error("Job not found");

		await ctx.db.patch(args.jobId, {
			status: "accepted",
			claimerId: staff._id,
			destinationSectionId: staff.sectionId,
		});
	},
});

// Reject/Release an accepted job back to pending
export const rejectJob = mutation({
	args: {
		accessToken: v.string(),
		jobId: v.id("jobs"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const { staff } = live;

		const job = await ctx.db.get(args.jobId);
		if (!job) throw new Error("Job not found");

		// Ensure only the active claimer or creator can reject/release the job
		if (job.claimerId !== staff._id && job.creatorId !== staff._id) {
			throw new Error("You are not authorized to reject this job.");
		}

		await ctx.db.patch(args.jobId, {
			status: "pending",
			claimerId: undefined,
			destinationSectionId: undefined,
		});
	},
});

// Resolve a completed job
export const resolveJob = mutation({
	args: {
		accessToken: v.string(),
		jobId: v.id("jobs"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const { staff } = live;

		const job = await ctx.db.get(args.jobId);
		if (!job) throw new Error("Job not found");

		// Ensure only the active claimer or creator can resolve the job
		if (job.claimerId !== staff._id && job.creatorId !== staff._id) {
			throw new Error("You are not authorized to resolve this job.");
		}

		await ctx.db.patch(args.jobId, {
			status: "resolved",
		});
	},
});

export const cancelJob = mutation({
	args: {
		accessToken: v.string(),
		jobId: v.id("jobs"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized or session expired.");

		const { staff } = live;

		const job = await ctx.db.get(args.jobId);
		if (!job) throw new Error("Job not found");

		if (job.creatorId !== staff._id) {
			throw new Error("You are not authorized to cancel this job.");
		}

		await ctx.db.delete(args.jobId);
	},
});
