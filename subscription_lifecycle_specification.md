# Lifecycle Specification: Credits, Cancellations & Tier Status

This specification outlines exactly what a **Credit** represents in Asistir and defines how to handle subscription cancellations, grace periods, and tier transitions under Convex's serverless architecture.

---

## 1. What Exactly is a Credit?

A **Pro Event Credit** represents a **single, 24-hour active window for a live Pro Event**.

### The Lifecycle of an Event & Credit Consumption
1.  **Draft Mode ($0 Cost):** An admin can create an event in `draft` status. They can configure settings, invite staff, and set up channels without spending any credits.
2.  **Going Live (Deducts 1 Credit):** When the admin clicks **"Go Live"**:
    *   The system checks if they have available credits (`monthlyCredits` or `oneTimeCredits`).
    *   If yes, **1 credit is deducted** (prioritizing `monthlyCredits` first).
    *   The event's status changes to `live`.
    *   `liveAt` is set to `Date.now()`.
    *   `expiresAt` is set to `Date.now() + (24 * 60 * 60 * 1000)` (exactly 24 hours later).
3.  **Archived Mode ($0 Cost):** After 24 hours, the event enters `archived` status. Staff can no longer send messages or manage jobs, but the admin can view the historical data for free indefinitely.

---

## 2. Subscription Cancellation & Grace Period

When a customer cancels their subscription through Polar, they have paid for the full 30 days and are entitled to use their subscription credits until that period ends.

### The Implementation Flow
*   **The Polar Webhook (`subscription.canceled` or `sub.canceled`):**
    When a cancellation event is received, **do not immediately revoke access or reset their credits**. Simply let the subscription run its course. Polar will let you know when the period officially ends, or you can rely on the `subscriptionExpiresAt` timestamp.
*   **Checking Pro Tier Status:**
    Instead of maintaining a hardcoded `tier = "pro"` field that you have to manually flip, evaluate Pro status dynamically using this logical formula:

```typescript
export function isUserPro(user: any): boolean {
  const now = Date.now();
  const hasActiveSubscription = user.subscriptionTier === "pro_monthly" && 
                                user.subscriptionExpiresAt && 
                                now < user.subscriptionExpiresAt;
                                
  const hasOneTimeCredits = (user.oneTimeCredits ?? 0) > 0;

  // The user is PRO if they have an active subscription OR if they have one-time credits remaining.
  return hasActiveSubscription || hasOneTimeCredits;
}
```

---

## 3. The Lazy Downgrade Flow

When `now >= user.subscriptionExpiresAt`, the subscription has officially ended. Here is how the system handles the transition smoothly:

```typescript
// When evaluating user status or starting a new event:
if (user.subscriptionTier === "pro_monthly" && Date.now() >= user.subscriptionExpiresAt) {
  // Lazy Downgrade: The billing period has ended and was not renewed.
  await ctx.db.patch(user._id, {
    subscriptionTier: "free",
    monthlyCredits: 0, // Revoke remaining monthly credits
  });
}
```

### 💎 Why this is perfect:
1.  **Canceling is risk-free:** If they cancel on day 15, `subscriptionExpiresAt` remains day 30. They keep their `monthlyCredits` and Pro access for the remaining 15 days.
2.  **Automatic Downgrade:** On day 31, the lazy check automatically changes their tier back to `"free"`, clears any unused `monthlyCredits`, but **leaves their `oneTimeCredits` completely untouched** so they can still use those in the future!
