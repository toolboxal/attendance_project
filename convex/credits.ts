import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const FREE_MAX_STAFF = 5;
export const PRO_MAX_STAFF = 50;
export const FREE_DRAFT_LIMIT = 1;
export const PAID_DRAFT_LIMIT = 10;

export type BillingPlan = "free" | "pay_as_you_go" | "pro_monthly";
export type EventTier = "free" | "pro";
export type CreditPool = "monthly" | "purchased" | "free_trial";

export type EventLimits = {
  tier: EventTier;
  maxStaff: number;
};

export function isPaidBillingPlan(
  billingPlan: BillingPlan | string | undefined,
): boolean {
  return billingPlan === "pro_monthly" || billingPlan === "pay_as_you_go";
}

export function getDraftLimit(billingPlan: BillingPlan | string | undefined): number {
  return isPaidBillingPlan(billingPlan) ? PAID_DRAFT_LIMIT : FREE_DRAFT_LIMIT;
}

/** Limits stamped on new drafts from the user's current billing plan. */
export function resolveDraftLimits(
  billingPlan: BillingPlan | string | undefined,
): EventLimits {
  return isPaidBillingPlan(billingPlan)
    ? { tier: "pro", maxStaff: PRO_MAX_STAFF }
    : { tier: "free", maxStaff: FREE_MAX_STAFF };
}

/** Limits applied at go-live based on which credit pool is consumed. */
export function resolveLimitsForCreditPool(pool: CreditPool): EventLimits {
  if (pool === "free_trial") {
    return { tier: "free", maxStaff: FREE_MAX_STAFF };
  }
  return { tier: "pro", maxStaff: PRO_MAX_STAFF };
}

export function getTotalCredits(user: Pick<
  Doc<"users">,
  "monthlyCredits" | "oneTimeCredits" | "freeTrialCredits"
>): number {
  return (
    (user.monthlyCredits ?? 0) +
    (user.oneTimeCredits ?? 0) +
    (user.freeTrialCredits ?? 0)
  );
}

/** Preview which pool would be consumed without mutating the user. */
export function peekGoLiveCreditPool(user: Pick<
  Doc<"users">,
  "monthlyCredits" | "oneTimeCredits" | "freeTrialCredits"
>): CreditPool | null {
  if ((user.monthlyCredits ?? 0) > 0) return "monthly";
  if ((user.oneTimeCredits ?? 0) > 0) return "purchased";
  if ((user.freeTrialCredits ?? 0) > 0) return "free_trial";
  return null;
}

export async function consumeGoLiveCredit(
  ctx: MutationCtx,
  user: Doc<"users">,
): Promise<CreditPool> {
  const pool = peekGoLiveCreditPool(user);
  if (!pool) {
    throw new Error("Insufficient pass credits. Please top up or upgrade to go live.");
  }

  if (pool === "monthly") {
    await ctx.db.patch(user._id, {
      monthlyCredits: (user.monthlyCredits ?? 0) - 1,
    });
  } else if (pool === "purchased") {
    await ctx.db.patch(user._id, {
      oneTimeCredits: (user.oneTimeCredits ?? 0) - 1,
    });
  } else {
    await ctx.db.patch(user._id, {
      freeTrialCredits: (user.freeTrialCredits ?? 0) - 1,
    });
  }

  return pool;
}

export async function countRoleSlots(
  ctx: MutationCtx,
  eventId: Id<"events">,
): Promise<number> {
  const slots = await ctx.db
    .query("roleSlots")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  return slots.length;
}

export function assertSlotCountWithinLimit(
  slotCount: number,
  maxStaff: number,
) {
  if (slotCount > maxStaff) {
    throw new ConvexError({
      title: "Staff Limit Reached",
      reason: `This event is limited to ${maxStaff} staff seats.`,
      actionNeeded:
        maxStaff <= FREE_MAX_STAFF
          ? "Remove role slots or upgrade to Pro for up to 50 staff."
          : "Remove role slots before saving.",
      errorType: 403,
    });
  }
}

export async function assertStaffCapacity(
  ctx: MutationCtx,
  eventId: Id<"events">,
  requestedSlotCount: number,
  maxStaff?: number,
) {
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Event not found");

  const cap = maxStaff ?? event.maxStaff;
  assertSlotCountWithinLimit(requestedSlotCount, cap);
}

export async function assertDraftLimit(
  ctx: MutationCtx,
  adminId: Id<"users">,
  billingPlan: BillingPlan | string | undefined,
) {
  const limit = getDraftLimit(billingPlan);
  const existingDrafts = await ctx.db
    .query("events")
    .withIndex("by_admin", (q) => q.eq("adminId", adminId))
    .filter((q) => q.eq(q.field("status"), "draft"))
    .collect();

  if (existingDrafts.length >= limit) {
    const isPaid = isPaidBillingPlan(billingPlan);
    throw new ConvexError({
      title: "Draft Limit Reached",
      reason: isPaid
        ? `You have reached the maximum limit of ${limit} draft events.`
        : `Free accounts can only have ${limit} draft event at a time.`,
      actionNeeded: isPaid
        ? "Please delete or activate an existing draft before creating a new one."
        : "Delete your existing draft or upgrade to Pro for more drafts.",
      errorType: 403,
    });
  }
}

export async function syncDraftEventsToLimits(
  ctx: MutationCtx,
  adminId: Id<"users">,
  limits: EventLimits,
) {
  const drafts = await ctx.db
    .query("events")
    .withIndex("by_admin", (q) => q.eq("adminId", adminId))
    .filter((q) => q.eq(q.field("status"), "draft"))
    .collect();

  for (const draft of drafts) {
    if (draft.tier !== limits.tier || draft.maxStaff !== limits.maxStaff) {
      await ctx.db.patch(draft._id, {
        tier: limits.tier,
        maxStaff: limits.maxStaff,
      });
    }
  }
}
