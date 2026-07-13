import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";
import { resolveDraftLimits, syncDraftEventsToLimits, getDraftLimit } from "./credits";
import { getAuthenticatedUser } from "./events";

async function findUserByAuthUserId(ctx: MutationCtx, authUserId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .first();
}

export const grantOneTimeCredits = internalMutation({
  args: {
    authUserId: v.string(),
    creditsToAdd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user) return;

    const oneTimeCredits = (user.oneTimeCredits ?? 0) + args.creditsToAdd;
    await ctx.db.patch(user._id, { oneTimeCredits });

    await syncDraftEventsToLimits(
      ctx,
      user._id,
      resolveDraftLimits({ ...user, oneTimeCredits }),
    );
  },
});

export const grantSubscription = internalMutation({
  args: {
    authUserId: v.string(),
    initialMonthlyCredits: v.number(),
    subscriptionPeriodEndsAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user) return;

    const monthlyCredits = args.initialMonthlyCredits;
    await ctx.db.patch(user._id, {
      billingPlan: "pro_monthly",
      subscriptionExpiresAt: args.subscriptionPeriodEndsAt,
      subscriptionCancelAtPeriodEnd: false,
      monthlyCredits,
    });

    await syncDraftEventsToLimits(
      ctx,
      user._id,
      resolveDraftLimits({
        ...user,
        billingPlan: "pro_monthly",
        monthlyCredits,
      }),
    );
  },
});

/** Sync period end / cancel flag from Polar without changing credits or plan. */
export const syncSubscriptionMetadata = internalMutation({
  args: {
    authUserId: v.string(),
    subscriptionPeriodEndsAt: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user || user.billingPlan !== "pro_monthly") return;

    await ctx.db.patch(user._id, {
      subscriptionExpiresAt: args.subscriptionPeriodEndsAt,
      subscriptionCancelAtPeriodEnd: args.cancelAtPeriodEnd,
      ...(args.polarSubscriptionId
        ? { polarSubscriptionId: args.polarSubscriptionId }
        : {}),
    });
  },
});

/** User canceled in Polar portal — keep Pro access until current period ends. */
export const markSubscriptionCanceled = internalMutation({
  args: {
    authUserId: v.string(),
    subscriptionPeriodEndsAt: v.number(),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user) return;

    await ctx.db.patch(user._id, {
      subscriptionCancelAtPeriodEnd: true,
      subscriptionExpiresAt: args.subscriptionPeriodEndsAt,
      ...(args.polarSubscriptionId
        ? { polarSubscriptionId: args.polarSubscriptionId }
        : {}),
    });
  },
});

/** User undid a pending cancellation in Polar portal. */
export const clearSubscriptionCanceled = internalMutation({
  args: {
    authUserId: v.string(),
    subscriptionPeriodEndsAt: v.number(),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user) return;

    await ctx.db.patch(user._id, {
      subscriptionCancelAtPeriodEnd: false,
      subscriptionExpiresAt: args.subscriptionPeriodEndsAt,
      ...(args.polarSubscriptionId
        ? { polarSubscriptionId: args.polarSubscriptionId }
        : {}),
    });
  },
});

/** Subscription ended (period over or revoked) — downgrade plan and monthly credits. */
export const revokeSubscription = internalMutation({
  args: {
    authUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user) return;

    const monthlyCredits = 0;
    await ctx.db.patch(user._id, {
      billingPlan: "free",
      monthlyCredits,
      subscriptionCancelAtPeriodEnd: false,
    });

    await syncDraftEventsToLimits(
      ctx,
      user._id,
      resolveDraftLimits({
        ...user,
        billingPlan: "free",
        monthlyCredits,
      }),
    );
  },
});

export const getBillingProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return {
      billingPlan: user.billingPlan ?? "free",
      monthlyCredits: user.monthlyCredits ?? 0,
      oneTimeCredits: user.oneTimeCredits ?? 0,
      freeTrialCredits: user.freeTrialCredits ?? 0,
      subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
      subscriptionCancelAtPeriodEnd:
        user.subscriptionCancelAtPeriodEnd ?? false,
      draftLimit: getDraftLimit(user),
    };
  },
});

export const updatePolarBillingIds = internalMutation({
  args: {
    authUserId: v.string(),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await findUserByAuthUserId(ctx, args.authUserId);
    if (!user) return;

    await ctx.db.patch(user._id, {
      polarCustomerId: args.polarCustomerId,
      polarSubscriptionId: args.polarSubscriptionId ?? user.polarSubscriptionId,
    });
  },
});

export const recordPayment = internalMutation({
  args: {
    authUserId: v.string(),
    checkoutId: v.string(),
    orderId: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
    productName: v.string(),
    status: v.string(),
    timestamp: v.string(),
    invoiceNo: v.string(),
    discountAmount: v.number(),
    netAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .first();

    if (existing) return;

    const createdAt = args.timestamp ? Date.parse(args.timestamp) : Date.now();

    await ctx.db.insert("payments", {
      authUserId: args.authUserId,
      checkoutId: args.checkoutId,
      timestamp: args.timestamp,
      orderId: args.orderId,
      invoiceNo: args.invoiceNo,
      totalAmount: args.totalAmount,
      currency: args.currency,
      discountAmount: args.discountAmount,
      netAmount: args.netAmount,
      productName: args.productName,
      status: args.status,
      createdAt,
    });
  },
});

export const getPaymentByCheckoutId = query({
  args: {
    checkoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .first();

    if (!payment || payment.authUserId !== user.authUserId) {
      return null;
    }

    return payment;
  },
});

export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", user.authUserId))
      .collect();

    return payments
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  },
});
