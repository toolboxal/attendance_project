# Lifecycle Specification: Credits, Cancellations & JIT Name Onboarding

This specification outlines exactly what a **Credit** represents in Asistir, defines how to handle subscription cancellations, and documents the **Just-in-Time Name Onboarding** pattern on event launch.

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
    Evaluate Pro status dynamically using this logical formula:

```typescript
export function isUserPro(user: any): boolean {
  const now = Date.now();
  const hasActiveSubscription = user.billingPlan === "pro_monthly" && 
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
if (user.billingPlan === "pro_monthly" && Date.now() >= user.subscriptionExpiresAt) {
  const hasOneTimeLeft = (user.oneTimeCredits ?? 0) > 0;
  
  // Lazy Downgrade: The billing period has ended.
  // Fall back to pay_as_you_go if they have lifetime credits, otherwise downgrade to free.
  await ctx.db.patch(user._id, {
    billingPlan: hasOneTimeLeft ? "pay_as_you_go" : "free",
    monthlyCredits: 0, // Revoke remaining monthly credits
  });
}
```

---

## 4. Just-In-Time Name Onboarding

To make sign-up and initial draft exploration completely frictionless, we do not force users to input a display name during registration. Instead, we perform a **Just-In-Time (JIT) name check** the moment they attempt to start a live event.

### The Flow
1.  **Clicking Go Live:** The admin clicks `"Go Live"` on a draft event.
2.  **The Name Guard:** The client checks if `user.name` is empty or missing.
    *   **If not empty:** Proceed directly to event launch.
    *   **If empty:** Intercept the action and display a sleek modal asking them to set their name (e.g., *"To start this live event as its supervisor, please enter your display name so your crew can identify you in chat and tasks."*).
3.  **Launch:** Once they submit their name inside the modal, a mutation updates `user.name` in the database, and the client proceeds to trigger the event launch mutation.
