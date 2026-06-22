# Lifecycle Specification: Credits, Renewals & JIT Name Onboarding

---

## 1. Credit pools

| Pool | Source | Staff at go-live |
| :--- | :--- | :--- |
| `monthlyCredits` | Pro Monthly | 50 (pro) |
| `oneTimeCredits` | Single Pass / Weekend Bundle | 50 (pro) |
| `freeTrialCredits` | Signup gift | 5 (free) |

**Go-live waterfall:** `monthly` → `purchased` → `free_trial`

---

## 2. Event lifecycle

1. **Draft** — no credit spent. Limits: 1 draft (free) or 10 (paid).
2. **Go live** — one credit consumed; `tier` / `maxStaff` set from pool used.
3. **Archived** — after 24h; history viewable free.

---

## 3. Subscription renewal

Polar auto-renews and sends **`order.paid`** on each successful charge.

On `order.paid` for the monthly product:

```typescript
// order.subscription.currentPeriodEnd from Polar payload
await grantSubscription({
  initialMonthlyCredits: 8,
  subscriptionPeriodEndsAt: new Date(order.subscription.currentPeriodEnd).getTime(),
});
```

- **`subscriptionExpiresAt`** — cached `current_period_end` for UI (“period ends …”)
- **`monthlyCredits`** — reset to **8** only on successful `order.paid`
- **No lazy evaluation** — no local cron or billing-page timer

---

## 4. Billing plans

| `billingPlan` | When |
| :--- | :--- |
| `free` | Signup; no purchased credits |
| `pay_as_you_go` | Has `oneTimeCredits` from purchase |
| `pro_monthly` | Active sub (`order.paid` grant) |

`freeTrialCredits` alone does not change `billingPlan`.

---

## 5. TODO: Cancellation & downgrade webhooks

Not implemented. Downgrade will be handled by Polar webhooks (not local expiry checks):

| Webhook | Action |
| :--- | :--- |
| `onSubscriptionCanceled` / `onSubscriptionUpdated` | Sync period end; no credit revoke yet |
| `onSubscriptionRevoked` | `monthlyCredits: 0`, downgrade plan, sync drafts |

---

## 6. JIT name onboarding

On **Go Live**, if `user.name` is empty → modal → save name → launch.

---

## 7. Trial after subscription example

1. Signup → `freeTrialCredits: 1`
2. Subscribe → `order.paid` → 8 monthly credits
3. Sub lapses (future: `subscription.revoked`) → monthly credits cleared
4. Go live on trial → **5 staff** only (even if draft had more slots configured as pro)
