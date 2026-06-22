export type BillingPlanId = "free" | "pro_monthly";

export function normalizeBillingPlan(
	billingPlan: string | undefined,
): BillingPlanId {
	if (billingPlan === "pro_monthly") return "pro_monthly";
	return "free";
}

/** Subscription plan only — credits are shown separately. */
export function getPlanDisplayLabel(billingPlan: string | undefined): string {
	return normalizeBillingPlan(billingPlan) === "pro_monthly"
		? "Pro Subscription"
		: "Free";
}

export function getPlanDescription(billingPlan: string | undefined): string {
	return normalizeBillingPlan(billingPlan) === "pro_monthly"
		? "Active monthly subscription with 8 credits per renewal."
		: "No subscription. Buy event passes or use your free trial to go live.";
}

export function isProSubscription(billingPlan: string | undefined): boolean {
	return normalizeBillingPlan(billingPlan) === "pro_monthly";
}
