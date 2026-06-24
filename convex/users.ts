import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";
import { deleteEventRelatedData, getAuthenticatedUser } from "./events";

async function findUserByAuthUserId(ctx: QueryCtx | MutationCtx, authUserId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .first();
}

function hasActiveSubscription(user: {
  billingPlan?: string;
  subscriptionCancelAtPeriodEnd?: boolean;
}) {
  return (
    user.billingPlan === "pro_monthly" &&
    user.subscriptionCancelAtPeriodEnd !== true
  );
}

async function getDeleteBlockers(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  user: {
    billingPlan?: string;
    subscriptionCancelAtPeriodEnd?: boolean;
  },
) {
  const liveEvent = await ctx.db
    .query("events")
    .withIndex("by_admin", (q) => q.eq("adminId", userId))
    .filter((q) => q.eq(q.field("status"), "live"))
    .first();

  const hasLiveEvent = liveEvent != null;
  const activeSubscription = hasActiveSubscription(user);

  let reason: string | null = null;
  if (hasLiveEvent) {
    reason =
      "You have a live event in progress. End or archive it before deleting your account.";
  } else if (activeSubscription) {
    reason =
      "Cancel your Pro subscription in the customer portal before deleting your account.";
  }

  return {
    allowed: !hasLiveEvent && !activeSubscription,
    reason,
    hasLiveEvent,
    hasActiveSubscription: activeSubscription,
  };
}

export const getAccountProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return {
      email: user.email,
      name: user.name ?? null,
      createdAt: user.createdAt,
    };
  },
});

export const canDeleteAccount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return await getDeleteBlockers(ctx, user._id, user);
  },
});

export const assertCanDeleteAccount = internalMutation({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user) return;

    const blockers = await getDeleteBlockers(ctx, user._id, user);
    if (!blockers.allowed) {
      throw new ConvexError({
        title: "Cannot Delete Account",
        reason: blockers.reason ?? "Account deletion is not allowed right now.",
        actionNeeded: blockers.hasActiveSubscription
          ? "Open the customer portal to cancel your subscription first."
          : "End your live event before deleting your account.",
        errorType: 400,
      });
    }
  },
});

async function anonymizePaymentsForUser(
  ctx: MutationCtx,
  authUserId: string,
) {
  const tombstone = `deleted_${authUserId.slice(0, 8)}`;
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .collect();

  for (const payment of payments) {
    await ctx.db.patch(payment._id, { authUserId: tombstone });
  }
}

export async function deleteAccountDataCore(
  ctx: MutationCtx,
  authUserId: string,
) {
  const user = await findUserByAuthUserId(ctx, authUserId);
  if (!user) return;

  const events = await ctx.db
    .query("events")
    .withIndex("by_admin", (q) => q.eq("adminId", user._id))
    .collect();

  for (const event of events) {
    await deleteEventRelatedData(ctx, event._id, user._id);
  }

  await anonymizePaymentsForUser(ctx, authUserId);
  await ctx.db.delete(user._id);
}

export const deleteAccountData = internalMutation({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    await deleteAccountDataCore(ctx, args.authUserId);
  },
});
