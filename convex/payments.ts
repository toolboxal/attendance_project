import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

export const grantOneTimeCredits = internalMutation({
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
      oneTimeCredits: (user.oneTimeCredits ?? 0) + args.creditsToAdd,
      billingPlan: "pay_as_you_go",
    });
  },
});

export const grantSubscription = internalMutation({
  args: {
    authUserId: v.string(),
    initialMonthlyCredits: v.number(),
    subscriptionExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    if (!user) return;

    await ctx.db.patch(user._id, {
      billingPlan: "pro_monthly",
      subscriptionExpiresAt: args.subscriptionExpiresAt,
      monthlyCredits: args.initialMonthlyCredits,
      monthlyCreditsResetAt: args.subscriptionExpiresAt, // Resets aligned with the next renewal date
    });
  },
});

async function lazyResetOrDowngradeUserLogic(ctx: MutationCtx, authUserId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .first();

  if (!user) return null;

  const now = Date.now();
  let patched = false;
  const patchObj: any = {};

  // 1. Handle Subscription Expiration (Downgrade to Free or Pay-as-you-go)
  if (
    user.billingPlan === "pro_monthly" &&
    user.subscriptionExpiresAt &&
    now >= user.subscriptionExpiresAt
  ) {
    const hasOneTimeLeft = (user.oneTimeCredits ?? 0) > 0;
    patchObj.billingPlan = hasOneTimeLeft ? "pay_as_you_go" : "free";
    patchObj.monthlyCredits = 0;
    patched = true;
  }
  // 2. Handle Monthly Subscription Credit Reset (New Billing Period)
  else if (
    user.billingPlan === "pro_monthly" &&
    user.monthlyCreditsResetAt &&
    now >= user.monthlyCreditsResetAt
  ) {
    patchObj.monthlyCredits = 8;
    // Advance reset date by 30 days
    patchObj.monthlyCreditsResetAt = user.monthlyCreditsResetAt + 30 * 24 * 60 * 60 * 1000;
    patched = true;
  }

  if (patched) {
    await ctx.db.patch(user._id, patchObj);
    return { ...user, ...patchObj };
  }

  return user;
}

export const lazyResetOrDowngradeUser = internalMutation({
  args: {
    authUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await lazyResetOrDowngradeUserLogic(ctx, args.authUserId);
  },
});

export const evaluateUserStatus = mutation({
  args: {
    authUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await lazyResetOrDowngradeUserLogic(ctx, args.authUserId);
  },
});

export const updatePolarBillingIds = internalMutation({
  args: {
    authUserId: v.string(),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

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
    // Avoid double recording on webhook retries
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

import { query } from "./_generated/server";

export const getPaymentByCheckoutId = query({
  args: {
    checkoutId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .first();
  },
});

