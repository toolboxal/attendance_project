# Lifecycle Specification: Credits, Renewals & Cancellation

---

## 1. Simplified model

**Plan** = subscription status only.  
**Credits** = how many live events you can run.

| UI | Meaning |
| :--- | :--- |
| **Free** | No active subscription |
| **Pro Subscription** | Active `pro_monthly` |
| **Purchased / Monthly / Trial credits** | Separate balances |

Buying a Single Pass or Weekend Bundle does **not** change plan — it adds **purchased credits**. Wedding customers stay on **Free**.

---

## 2. Credit pools & go-live

| Pool | Source | Staff at go-live |
| :--- | :--- | :--- |
| `monthlyCredits` | Pro Monthly | 50 |
| `oneTimeCredits` | Event passes | 50 |
| `freeTrialCredits` | Signup | 5 |

**Waterfall:** monthly → purchased → trial

---

## 3. Draft limits

`hasProCapacity` = subscription OR any credits on balance:

| | Drafts | Planning staff cap |
| :--- | :--- | :--- |
| No pro capacity | 1 | 5 |
| Has pro capacity | 10 | 50 |

After using the last credit (no subscription), drafts downgrade to free limits.

---

## 4. Subscription renewal

Polar `order.paid` → 8 `monthlyCredits` + update `subscriptionExpiresAt` from Polar `currentPeriodEnd`.

---

## 5. Cancellation (cancel at period end)

### UI entry point

Billing page → **Cancel or Manage Subscription** → Polar customer portal (`authClient.customer.portal()`).

There is no in-app cancel button. Polar hosts cancellation, invoices, and payment methods.

### Webhook flow

```
User cancels in Polar portal
        ↓
subscription.canceled webhook
        ↓
markSubscriptionCanceled
  · subscriptionCancelAtPeriodEnd: true
  · subscriptionExpiresAt updated
  · billingPlan stays pro_monthly
  · monthlyCredits unchanged
        ↓
User keeps full Pro access until period end
        ↓
Period ends → subscription.revoked webhook
        ↓
revokeSubscription
  · billingPlan: free
  · monthlyCredits: 0
  · sync drafts via hasProCapacity
```

If the user **undoes** cancellation before period end, Polar sends `subscription.uncanceled` → `clearSubscriptionCanceled`.

### Entitlements during pending cancellation

While `subscriptionCancelAtPeriodEnd` is true, the user still has:

- `billingPlan: pro_monthly` → `hasProCapacity` true
- Remaining `monthlyCredits`
- 10 drafts / 50 staff planning

Purchased credits (`oneTimeCredits`) are unaffected by subscription cancellation.

---

## 6. JIT name onboarding

Collect `user.name` on first go-live if missing.

---

## 8. Upgrading

All upgrades happen **in-app** via Polar checkout (`authClient.checkout`).

| From | Action | Webhook | Result |
| :--- | :--- | :--- | :--- |
| Free (no credits) | Buy Single / Weekend pass | `order.paid` | `oneTimeCredits += N`, drafts → 10 / 50 staff |
| Free (no credits) | Subscribe Pro Monthly | `order.paid` | `pro_monthly`, `monthlyCredits: 8` |
| Free (has passes) | Subscribe Pro Monthly | `order.paid` | Plan → `pro_monthly`; passes **kept** |
| Pro subscriber | Buy passes | `order.paid` | `oneTimeCredits += N` only |
| Lapsed subscriber | Re-subscribe | `order.paid` | `grantSubscription` restores Pro |

Renewals reset `monthlyCredits` to 8 on each monthly `order.paid`.

---

## 9. Downgrading

| Trigger | Handler | Result |
| :--- | :--- | :--- |
| Last credit used at go-live (no sub) | `consumeGoLiveCredit` | Drafts → 5 staff / 1 draft limit |
| Subscription period ends / revoked | `revokeSubscription` | `free`, `monthlyCredits: 0`, sync drafts |
| Cancel at period end (pending) | `markSubscriptionCanceled` | **No downgrade yet** — full Pro until period end |

If user still has purchased passes after subscription ends, `hasProCapacity` stays true via `oneTimeCredits`.

Excess draft rows above your tier limit are retained, but **no account may create an 11th draft** (absolute cap: 10).

---

## 10. Wedding customer example

1. Signup → Free, 1 trial credit
2. Buy Single Pass → still **Free**, `oneTimeCredits: 1`
3. Plan draft with 50 role slots (has pro capacity)
4. Go live → uses purchased credit → 50 staff live event
5. After event → `oneTimeCredits: 0` → drafts back to 5 staff, plan still **Free**
