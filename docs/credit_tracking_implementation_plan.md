# Implementation Plan: Separate Credit Tracking & Polar Renewal

Three credit pools on the user record. Staff limits at go-live follow the **credit pool consumed**, not just billing plan.

Implementation: `convex/credits.ts`, `convex/payments.ts`, `convex/auth.ts`, `convex/events.ts`.

---

## 1. Database Schema (`convex/schema.ts`)

```typescript
billingPlan: v.optional(v.union(v.literal("free"), v.literal("pay_as_you_go"), v.literal("pro_monthly"))),
subscriptionExpiresAt: v.optional(v.number()), // Cached Polar subscription.current_period_end

freeTrialCredits: v.optional(v.number()),   // Signup gift (5 staff)
oneTimeCredits: v.optional(v.number()),       // Purchased passes (50 staff)
monthlyCredits: v.optional(v.number()),     // Reset to 8 on each order.paid renewal
```

No `monthlyCreditsResetAt` — credits reset only when Polar fires `order.paid`.

---

## 2. Go-live waterfall

```
monthlyCredits → oneTimeCredits → freeTrialCredits
```

| Pool consumed | `tier` | `maxStaff` |
| :--- | :--- | :--- |
| monthly | pro | 50 |
| purchased | pro | 50 |
| free_trial | free | 5 |

---

## 3. Subscription renewal (Polar-first)

**Polar** auto-charges recurring subscriptions and sends **`order.paid`** on each successful payment (initial + renewals).

**Your app** (`onOrderPaid` in `convex/auth.ts`):

1. Read `order.subscription.currentPeriodEnd` from the webhook payload
2. Call `grantSubscription`:
   - `monthlyCredits: 8`
   - `subscriptionExpiresAt: currentPeriodEnd` (ms)
   - `billingPlan: "pro_monthly"`

No local 30-day timers. No lazy evaluation. If `currentPeriodEnd` is missing, log an error and skip the grant.

---

## 4. Draft limits & staff enforcement

| Account | Max drafts | Pro staff | Trial staff |
| :--- | :--- | :--- | :--- |
| Free | 1 | — | 5 |
| Paid | 10 | 50 | 5 |

Drafts sync to pro/free limits on `grantOneTimeCredits` / `grantSubscription`.

---

## 5. TODO: Polar subscription lifecycle webhooks

Renewal is handled via **`order.paid`**. Still deferred:

| Webhook | Purpose |
| :--- | :--- |
| `onSubscriptionCanceled` / `onSubscriptionUpdated` | Sync `subscriptionExpiresAt` for cancel-at-period-end UI |
| `onSubscriptionRevoked` | Downgrade `billingPlan`, zero monthly credits, sync drafts |

---

## 6. One-time purchases (`onOrderPaid`)

- `single` / `weekend` → add to `oneTimeCredits`, `billingPlan: "pay_as_you_go"`, upgrade drafts
