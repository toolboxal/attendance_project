import { v } from "convex/values";
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";

async function getAuthenticatedStaff(
	ctx: QueryCtx | MutationCtx,
	accessToken: string,
) {
	const staff = await ctx.db
		.query("liveStaff")
		.withIndex("by_accessToken", (q) => q.eq("accessToken", accessToken))
		.first();

	if (!staff || staff.status === "checked_out") {
		return null;
	}
	return staff;
}

// Retrieve active (pending and accepted) jobs for a specific event
export const getActiveJobs = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const staff = await getAuthenticatedStaff(ctx, args.accessToken);
		if (!staff) return [];

		// Query unresolved jobs for this event
		const jobs = await ctx.db
			.query("jobs")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.filter((q) => q.neq(q.field("status"), "resolved"))
			.order("desc")
			.take(20); // Hard-capped at 15 globally by dispatchJob anyway

		// Enrich jobs with human-readable names
		const enrichedJobs = await Promise.all(
			jobs.map(async (job) => {
				const creator = await ctx.db.get(job.creatorId);
				const claimer = job.claimerId ? await ctx.db.get(job.claimerId) : null;
				
				const creatorRoleSlot = creator 
					? await ctx.db.query("roleSlots").withIndex("by_assignedStaff", (q) => q.eq("assignedStaffId", creator._id)).first() 
					: null;
					
				const claimerRoleSlot = claimer 
					? await ctx.db.query("roleSlots").withIndex("by_assignedStaff", (q) => q.eq("assignedStaffId", claimer._id)).first() 
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
					creatorRoleTitle: creatorRoleSlot?.title || "",
					claimerName: claimer?.staffName,
					claimerRole: claimerRoleSlot?.role || claimer?.role,
					claimerRoleTitle: claimerRoleSlot?.title || "",
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

// Retrieve resolved jobs for history audit
export const getHistoryJobs = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const staff = await getAuthenticatedStaff(ctx, args.accessToken);
		if (!staff) return [];

		// Query resolved jobs for this event, newest first, limited to 30
		const jobs = await ctx.db
			.query("jobs")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.filter((q) => q.eq(q.field("status"), "resolved"))
			.order("desc")
			.take(30);

		// Enrich jobs with human-readable names
		const enrichedJobs = await Promise.all(
			jobs.map(async (job) => {
				const creator = await ctx.db.get(job.creatorId);
				const claimer = job.claimerId ? await ctx.db.get(job.claimerId) : null;
				
				const creatorRoleSlot = creator 
					? await ctx.db.query("roleSlots").withIndex("by_assignedStaff", (q) => q.eq("assignedStaffId", creator._id)).first() 
					: null;
					
				const claimerRoleSlot = claimer 
					? await ctx.db.query("roleSlots").withIndex("by_assignedStaff", (q) => q.eq("assignedStaffId", claimer._id)).first() 
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
					creatorRoleTitle: creatorRoleSlot?.title || "",
					claimerName: claimer?.staffName,
					claimerRole: claimerRoleSlot?.role || claimer?.role,
					claimerRoleTitle: claimerRoleSlot?.title || "",
					originSectionName: originSection?.name || "Unknown Gate",
					destinationSectionName: destinationSection?.name,
				};
			}),
		);

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
		const staff = await getAuthenticatedStaff(ctx, args.accessToken);
		if (!staff) throw new Error("Unauthorized or session expired.");

		// Enforce WIP cap of dynamic active (pending/accepted) jobs for this event
		const event = await ctx.db.get(staff.eventId);
		const limit = event?.activeJobLimit ?? 15;

		const activeJobs = await ctx.db
			.query("jobs")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.filter((q) => q.neq(q.field("status"), "resolved"))
			.collect();

		if (activeJobs.length >= limit) {
			throw new Error(`Active job limit reached (max ${limit}). Please wait for current jobs to be accepted and resolved.`);
		}

		const jobId = await ctx.db.insert("jobs", {
			eventId: staff.eventId,
			creatorId: staff._id,
			originSectionId: staff.sectionId,
			personCount: args.personCount,
			requestType: args.requestType,
			description: args.description,
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
		const staff = await getAuthenticatedStaff(ctx, args.accessToken);
		if (!staff) throw new Error("Unauthorized or session expired.");

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
		const staff = await getAuthenticatedStaff(ctx, args.accessToken);
		if (!staff) throw new Error("Unauthorized or session expired.");

		const job = await ctx.db.get(args.jobId);
		if (!job) throw new Error("Job not found");

		// Ensure only the active claimer can reject/release the job
		if (job.claimerId !== staff._id) {
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
		const staff = await getAuthenticatedStaff(ctx, args.accessToken);
		if (!staff) throw new Error("Unauthorized or session expired.");

		const job = await ctx.db.get(args.jobId);
		if (!job) throw new Error("Job not found");

		// Ensure only the active claimer can resolve the job
		if (job.claimerId !== staff._id) {
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
		const staff = await getAuthenticatedStaff(ctx, args.accessToken);
		if (!staff) throw new Error("Unauthorized or session expired.");

		const job = await ctx.db.get(args.jobId);
		if (!job) throw new Error("Job not found");

		// Ensure only the active claimer can resolve the job
		if (job.creatorId !== staff._id) {
			throw new Error("You are not authorized to cancel this job.");
		}

		await ctx.db.delete(args.jobId);
	},
});