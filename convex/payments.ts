import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const grantEventCredits = internalMutation({
  args: {
    authUserId: v.string(),
    creditsToAdd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    if (!user) return;

    await ctx.db.patch(user._id, {
      eventCredits: (user.eventCredits ?? 0) + args.creditsToAdd,
    });
  },
});

export const grantSubscription = internalMutation({
  args: {
    authUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    if (!user) return;

    await ctx.db.patch(user._id, {
      subscriptionTier: "pro_monthly",
    });
  },
});
