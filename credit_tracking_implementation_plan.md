# Implementation Plan: Separate Credit Tracking & Lazy Reset

To successfully implement **Model A**, we must separate **Monthly Subscription Credits** (which reset monthly and do not roll over) from **One-Time Purchase Credits** (which remain on the account forever until consumed).

---

## 1. Database Schema Design

We will modify the monetization fields in `convex/schema.ts` to cleanly separate these two credit pools and track the subscription cycle.

### Proposed Schema Fields
```typescript
// inside users defineTable
subscriptionTier: v.optional(v.union(v.literal("free"), v.literal("pro_monthly"))),
subscriptionExpiresAt: v.optional(v.number()), // Unix timestamp for subscription end

// 1. One-Time Purchase Credits (Lifetime, no expiration)
oneTimeCredits: v.optional(v.number()), // E.g. purchased from Single Pass or Weekend Bundle

// 2. Subscription Credits (Resets monthly, no rollover)
monthlyCredits: v.optional(v.number()), // E.g. 8 credits per month
monthlyCreditsResetAt: v.optional(v.number()), // Unix timestamp of when the credits should next reset
```

---

## 2. The Golden Rule of Consumption (UX & Economy)

When a user triggers a Pro event, the system must decide which credit pool to deduct from first. 

> [!IMPORTANT]
> **Deduction Priority Flow:**
> 1. **Check Subscription Credits first:** Always deduct from `monthlyCredits` first, because they are "use-it-or-lose-it" and will expire at the end of the billing cycle.
> 2. **Check One-Time Credits second:** Only deduct from `oneTimeCredits` if `monthlyCredits` is `0` (or if they are not subscribed).
> 3. **Reject if both are 0:** Prompt the user to either upgrade or buy a top-up credit.

---

## 3. The "Lazy Evaluation" Reset Pattern (Elegant Serverless)

Instead of running a heavy, complex background cron job on the 1st of every month to reset credits for all subscribers, use a **lazy evaluation pattern**. 

Whenever a user logs in, visits their dashboard, or attempts to go live with an event, run a quick check:

```typescript
const now = Date.now();

// If the user is a subscriber and the current time has passed their reset timestamp:
if (user.subscriptionTier === "pro_monthly" && user.monthlyCreditsResetAt && now >= user.monthlyCreditsResetAt) {
  // 1. Calculate how many months have elapsed since the last reset (usually 1)
  // 2. Reset monthlyCredits back to 8
  // 3. Advance monthlyCreditsResetAt to the next month's billing date
  await ctx.db.patch(user._id, {
    monthlyCredits: 8,
    monthlyCreditsResetAt: calculateNextBillingDate(user.monthlyCreditsResetAt),
  });
}
```

### Why Lazy Evaluation Wins:
*   **Zero Serverless Overhead:** You only execute the database write when the user is actually active.
*   **Perfect Accuracy:** The exact millisecond the user returns after their billing cycle ends, their credits are cleanly updated before they can perform any action.
*   **No Cron Failures:** Traditional cron jobs can fail, skip, or drift. This code executes in the request cycle, making it deterministic.

---

## 4. How Polar Webhooks Handle Both Purchases

In `convex/auth.ts`, your Polar webhook handles `order.paid`. Here is how the two different products distribute credits under this model:

### Case 1: One-Time Purchase (`single` or `weekend`)
Directly add to `oneTimeCredits`.
```typescript
await actionCtx.runMutation(internal.payments.grantOneTimeCredits, {
    authUserId,
    creditsToAdd: order.productId === process.env.POLAR_PRODUCT_ID_SINGLE ? 1 : 3,
});
```

### Case 2: Monthly Subscription (`monthly`)
Grant the subscription tier, initialize `monthlyCredits` to 8, and set the initial reset date to 30 days from now (or the next billing date provided by Polar).
```typescript
await actionCtx.runMutation(internal.payments.grantSubscription, {
    authUserId,
    initialMonthlyCredits: 8,
    resetAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
});
```
