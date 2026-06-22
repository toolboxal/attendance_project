# Implementation Plan: Credits & Polar Renewal

**Plan** (subscription) and **credits** (inventory) are separate concepts.

- **Plan:** `free` | `pro_monthly` — subscription only
- **Credits:** `freeTrialCredits`, `oneTimeCredits`, `monthlyCredits` — balances shown in UI

Implementation: `convex/credits.ts`, `convex/payments.ts`, `convex/auth.ts`, `convex/events.ts`.

---

## 1. Schema (`convex/schema.ts`)

```typescript
billingPlan: v.optional(v.union(v.literal("free"), v.literal("pro_monthly"))),
subscriptionExpiresAt: v.optional(v.number()), // Polar current_period_end

freeTrialCredits: v.optional(v.number()),  // Signup gift → 5 staff at go-live
oneTimeCredits: v.optional(v.number()),      // Single pass / weekend bundle → 50 staff
monthlyCredits: v.optional(v.number()),      // Reset to 8 on each order.paid renewal
```

There is no `pay_as_you_go` plan. Buying event passes adds to `oneTimeCredits` only.

---

## 2. Entitlements (not plan labels)

```typescript
hasProCapacity(user) =
  billingPlan === "pro_monthly"
  OR oneTimeCredits > 0
  OR monthlyCredits > 0
```

Used for **draft limits** (1 vs 10, absolute max 10) and **draft planning** (`maxStaff` 5 vs 50).

**Go-live** staff cap comes from **which credit pool is consumed**, not plan alone:

| Pool consumed | Staff |
| :--- | :--- |
| monthly / purchased | 50 |
| free_trial | 5 |

**Waterfall:** `monthlyCredits` → `oneTimeCredits` → `freeTrialCredits`

When credits are exhausted and no subscription, drafts sync back to free limits (5 staff).

---

## 3. Products

| Product | Effect on plan | Effect on credits |
| :--- | :--- | :--- |
| Signup | `free` | `freeTrialCredits: 1` |
| Single Pass | unchanged (`free`) | `oneTimeCredits += 1` |
| Weekend Bundle | unchanged (`free`) | `oneTimeCredits += 3` |
| Pro Monthly | `pro_monthly` | `monthlyCredits: 8` on each `order.paid` |

Wedding / one-off customers stay on **Free** plan and buy **purchased credits**.

---

## 4. Subscription renewal (Polar)

On `order.paid` for monthly product:

1. Read `order.subscription.currentPeriodEnd`
2. `grantSubscription` → `monthlyCredits: 8`, `subscriptionExpiresAt`, `billingPlan: pro_monthly`

No local timers. No lazy evaluation.

---

## 5. Cancellation webhooks

| Webhook | Handler | Effect |
| :--- | :--- | :--- |
| `subscription.canceled` | `markSubscriptionCanceled` | Flag pending cancel; **keep** Pro access until period end |
| `subscription.uncanceled` | `clearSubscriptionCanceled` | User undid cancel in Polar portal |
| `subscription.revoked` | `revokeSubscription` | `billingPlan: free`, `monthlyCredits: 0`, sync drafts |

**UI:** Billing → **Cancel or Manage Subscription** → Polar portal (no in-app cancel button).

---

## 6. Upgrading & downgrading

### Upgrading (in-app checkout)

| Product | Plan change | Credits | Draft sync |
| :--- | :--- | :--- | :--- |
| Single / Weekend | None (`free`) | `oneTimeCredits += N` | → pro capacity |
| Pro Monthly | `pro_monthly` | `monthlyCredits: 8` | → pro capacity |

### Downgrading

| Trigger | Credits / plan | Draft sync |
| :--- | :--- | :--- |
| Last credit used (no sub) | Balances only | → free limits if no `hasProCapacity` |
| `subscription.revoked` | `free`, monthly → 0 | via `hasProCapacity` |

---

## 7. UI

| Display | Source |
| :--- | :--- |
| **Plan:** Free / Pro Subscription | `billingPlan` |
| **Purchased / Monthly / Trial credits** | credit pools |
