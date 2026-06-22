import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import {
  resolveDraftLimits,
  syncDraftEventsToLimits,
} from "./credits";

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

    await syncDraftEventsToLimits(ctx, user._id, resolveDraftLimits("pay_as_you_go"));
  },
});

export const grantSubscription = internalMutation({
  args: {
    authUserId: v.string(),
    initialMonthlyCredits: v.number(),
    subscriptionPeriodEndsAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    if (!user) return;

    await ctx.db.patch(user._id, {
      billingPlan: "pro_monthly",
      subscriptionExpiresAt: args.subscriptionPeriodEndsAt,
      monthlyCredits: args.initialMonthlyCredits,
    });

    await syncDraftEventsToLimits(ctx, user._id, resolveDraftLimits("pro_monthly"));
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
    return await ctx.db
      .query("payments")
      .withIndex("by_checkoutId", (q) => q.eq("checkoutId", args.checkoutId))
      .first();
  },
});
