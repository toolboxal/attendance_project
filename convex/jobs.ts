import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Retrieve active jobs for a specific event
export const getAllJobs = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const staff = await ctx.db
			.query("liveStaff")
			.withIndex("by_accessToken", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!staff || staff.status === "checked_out") return [];

		// Query jobs for this event, sort by newest
		const jobs = await ctx.db
			.query("jobs")
			.withIndex("by_event", (q) => q.eq("eventId", staff.eventId))
			.order("desc")
			.take(100);

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
		const staff = await ctx.db
			.query("liveStaff")
			.withIndex("by_accessToken", (q) => q.eq("accessToken", args.accessToken))
			.first();

		if (!staff || staff.status === "checked_out") {
			throw new Error("Unauthorized or session expired.");
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
