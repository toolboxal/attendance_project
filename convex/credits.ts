import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const FREE_MAX_STAFF = 5;
export const PRO_MAX_STAFF = 50;
export const FREE_DRAFT_LIMIT = 1;
/** Hard ceiling — no account may create more than this many drafts. */
export const MAX_DRAFT_LIMIT = 5;
/** Hard ceiling — oldest archived events are deleted when over this. */
export const MAX_ARCHIVED_EVENTS = 10;

export type BillingPlan = "free" | "pro_monthly";
export type EventTier = "free" | "pro";
export type CreditPool = "monthly" | "purchased" | "free_trial";

export type EventLimits = {
  tier: EventTier;
  maxStaff: number;
};

export type UserEntitlements = Pick<
  Doc<"users">,
  "billingPlan" | "oneTimeCredits" | "monthlyCredits"
>;

export function isProSubscription(
  billingPlan: string | undefined,
): boolean {
  return billingPlan === "pro_monthly";
}

/** Pro draft capacity: active subscription OR any paid credits on balance. */
export function hasProCapacity(user: UserEntitlements): boolean {
  if (isProSubscription(user.billingPlan)) return true;
  return (user.oneTimeCredits ?? 0) > 0 || (user.monthlyCredits ?? 0) > 0;
}

export function getDraftLimit(user: UserEntitlements): number {
  if (!hasProCapacity(user)) return FREE_DRAFT_LIMIT;
  return MAX_DRAFT_LIMIT;
}

/** Draft planning limits from current entitlements (not billing plan alone). */
export function resolveDraftLimits(user: UserEntitlements): EventLimits {
  return hasProCapacity(user)
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

export function getTotalCredits(
  user: Pick<
    Doc<"users">,
    "monthlyCredits" | "oneTimeCredits" | "freeTrialCredits"
  >,
): number {
  return (
    (user.monthlyCredits ?? 0) +
    (user.oneTimeCredits ?? 0) +
    (user.freeTrialCredits ?? 0)
  );
}

export function peekGoLiveCreditPool(
  user: Pick<
    Doc<"users">,
    "monthlyCredits" | "oneTimeCredits" | "freeTrialCredits"
  >,
): CreditPool | null {
  if ((user.monthlyCredits ?? 0) > 0) return "monthly";
  if ((user.oneTimeCredits ?? 0) > 0) return "purchased";
  if ((user.freeTrialCredits ?? 0) > 0) return "free_trial";
  return null;
}

/** User-facing error when go-live is blocked by an empty credit balance. */
export function insufficientGoLiveCreditsError() {
  return new ConvexError({
    title: "Can't go live",
    reason: "You're out of event credits.",
    actionNeeded:
      "Open Billing to buy a pass or start Pro Monthly.",
    errorType: "insufficient_credits",
  });
}

export async function consumeGoLiveCredit(
  ctx: MutationCtx,
  user: Doc<"users">,
): Promise<CreditPool> {
  const pool = peekGoLiveCreditPool(user);
  if (!pool) {
    throw insufficientGoLiveCreditsError();
  }

  const patch: Partial<Doc<"users">> = {};
  if (pool === "monthly") {
    patch.monthlyCredits = (user.monthlyCredits ?? 0) - 1;
  } else if (pool === "purchased") {
    patch.oneTimeCredits = (user.oneTimeCredits ?? 0) - 1;
  } else {
    patch.freeTrialCredits = (user.freeTrialCredits ?? 0) - 1;
  }

  await ctx.db.patch(user._id, patch);

  const updatedUser = { ...user, ...patch };
  if (!hasProCapacity(updatedUser)) {
    await syncDraftEventsToLimits(ctx, user._id, resolveDraftLimits(updatedUser));
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
          ? "Remove role slots or buy an event pass for up to 50 staff."
          : "Remove role slots before saving.",
      errorType:
        maxStaff <= FREE_MAX_STAFF ? "staff_limit_free" : "staff_limit",
    });
  }
}

/** Staff-cap check at go-live, with credit-pool-aware copy. */
export function assertGoLiveStaffCapacity(
  slotCount: number,
  pool: CreditPool,
) {
  const { maxStaff } = resolveLimitsForCreditPool(pool);
  if (slotCount <= maxStaff) return;

  const isFreeTrial = pool === "free_trial";
  throw new ConvexError({
    title: "Can't go live",
    reason: isFreeTrial
      ? `No paid credits left — going live would use your free trial, which only covers ${maxStaff} staff seats. This event has ${slotCount}.`
      : `This event has ${slotCount} role slots, but the limit is ${maxStaff} staff seats.`,
    actionNeeded: isFreeTrial
      ? "Remove extra slots, or buy a pass / Pro Monthly for up to 50 seats."
      : "Remove role slots before going live.",
    errorType: isFreeTrial ? "staff_limit_free" : "staff_limit",
  });
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
  user: UserEntitlements,
) {
  const existingDrafts = await ctx.db
    .query("events")
    .withIndex("by_admin", (q) => q.eq("adminId", adminId))
    .filter((q) => q.eq(q.field("status"), "draft"))
    .collect();

  if (existingDrafts.length >= MAX_DRAFT_LIMIT) {
    throw new ConvexError({
      title: "Draft Limit Reached",
      reason: `Accounts cannot have more than ${MAX_DRAFT_LIMIT} draft events.`,
      actionNeeded:
        "Delete or go live with an existing draft before creating another.",
      errorType: 403,
    });
  }

  const tierLimit = getDraftLimit(user);
  if (existingDrafts.length >= tierLimit) {
    const proCapacity = hasProCapacity(user);
    throw new ConvexError({
      title: "Draft Limit Reached",
      reason: proCapacity
        ? `You have reached the maximum limit of ${tierLimit} draft events.`
        : `Free accounts can only have ${tierLimit} draft event at a time.`,
      actionNeeded: proCapacity
        ? "Please delete or activate an existing draft before creating a new one."
        : "Delete your existing draft, subscribe to Pro, or buy an event pass.",
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
