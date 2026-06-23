import { getPlanDisplayLabel, isProSubscription } from "#/lib/billing-plan";

export type CreditsMetricsData = {
	billingPlan: string;
	monthlyCredits: number;
	oneTimeCredits: number;
	freeTrialCredits: number;
	subscriptionExpiresAt: number | null;
	subscriptionCancelAtPeriodEnd: boolean;
};

function formatBillingDate(timestamp: number | null | undefined): string {
	if (!timestamp) return "N/A";
	return new Date(timestamp).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function CreditsMetricsPanel({
	billingPlan,
	monthlyCredits,
	oneTimeCredits,
	freeTrialCredits,
	subscriptionExpiresAt,
	subscriptionCancelAtPeriodEnd,
}: CreditsMetricsData) {
	const isProSubscriber = isProSubscription(billingPlan);
	const planLabel = getPlanDisplayLabel(billingPlan);
	const isPendingCancellation = subscriptionCancelAtPeriodEnd;

	return (
		<div className="bg-zinc-900/40 p-6 rounded-xl flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div className="flex flex-1 flex-col">
				<h2 className="text-md text-zinc-400 font-bold">Your Current Plan</h2>
				<p className="text-lg text-yellow-100 font-semibold mt-1 leading-tight">
					{planLabel}
				</p>
				<p className="text-xs text-zinc-300 font-semibold">
					{isProSubscriber && !isPendingCancellation ? "Active" : "Cancelled"}
				</p>
			</div>
			<div className="flex flex-1 flex-col self-stretch">
				<p className="text-md text-zinc-400 font-bold">Monthly Credits</p>
				<p className="text-xs text-zinc-300">
					{isPendingCancellation ? "Ends" : "Renews"} on{" "}
					{formatBillingDate(subscriptionExpiresAt)}
				</p>
				<p className="text-3xl text-zinc-100 font-bold mt-auto">
					{monthlyCredits}
				</p>
			</div>
			<div className="flex flex-1 flex-col">
				<p className="text-md text-zinc-400 font-bold">One-Time Credits</p>
				<p className="text-xs text-zinc-300">
					Single or Weekend Bundle Credits. Does not expire.
				</p>
				<p className="text-3xl text-zinc-100 font-bold mt-2">{oneTimeCredits}</p>
			</div>
			<div className="flex flex-1 flex-col">
				<p className="text-md text-zinc-400 font-bold">Free Trial Credits</p>
				<p className="text-xs text-zinc-300">
					Signup gift. Limited to 5 staff per live event.
				</p>
				<p className="text-3xl text-zinc-100 font-bold mt-2">
					{freeTrialCredits}
				</p>
			</div>
		</div>
	);
}
