import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Retrieve active jobs for a specific event
export const getActiveJobs = query({
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
			.filter((q) => q.neq(q.field("status"), "resolved"))
			.order("desc")
			.take(50);

		return jobs;
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
