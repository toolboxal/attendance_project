import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { DashboardCreditsMetricCard } from "#/components/dashboard/DashboardCreditsMetricCard";
import { Button } from "#/components/ui/button";
import {
	getPlanDescription,
	getPlanDisplayLabel,
	isProSubscription,
} from "#/lib/billing-plan";

export type DashboardCredits = {
	monthlyCredits: number;
	oneTimeCredits: number;
	freeTrialCredits: number;
	billingPlan: string;
	subscriptionExpiresAt: number | null;
	subscriptionCancelAtPeriodEnd: boolean;
};

type DashboardCreditsMetricsProps = {
	credits: DashboardCredits;
};

function formatBillingDate(timestamp: number | null): string | undefined {
	if (!timestamp) return undefined;
	return format(new Date(timestamp), "MMM d, yyyy");
}

export function DashboardCreditsMetrics({ credits }: DashboardCreditsMetricsProps) {
	const navigate = useNavigate();
	const planLabel = getPlanDisplayLabel(credits.billingPlan);
	const isSubscription = isProSubscription(credits.billingPlan);
	const totalCredits =
		credits.monthlyCredits + credits.oneTimeCredits + credits.freeTrialCredits;
	const creditsLow = totalCredits === 0 && !isSubscription;

	const periodEndLabel = formatBillingDate(credits.subscriptionExpiresAt);
	const subscriptionSubtitle =
		isSubscription && credits.subscriptionCancelAtPeriodEnd && periodEndLabel
			? `Cancels ${periodEndLabel} · full access until then`
			: isSubscription && periodEndLabel
				? `Period ends ${periodEndLabel}`
				: getPlanDescription(credits.billingPlan);
	const monthlySubtitle =
		isSubscription && credits.subscriptionCancelAtPeriodEnd && periodEndLabel
			? `Cancels ${periodEndLabel} · credits usable until then`
			: isSubscription && periodEndLabel
				? `Renews via Polar · period ends ${periodEndLabel}`
				: "Pro subscription only";

	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<DashboardCreditsMetricCard
					label="Monthly credits"
					value={credits.monthlyCredits}
					subtitle={monthlySubtitle}
				/>
				<DashboardCreditsMetricCard
					label="Purchased credits"
					value={credits.oneTimeCredits}
					subtitle="Event passes · up to 50 staff"
				/>
				<DashboardCreditsMetricCard
					label="Free trial"
					value={credits.freeTrialCredits}
					subtitle="Up to 5 staff per event"
				/>
				<DashboardCreditsMetricCard
					label="Your plan"
					value={planLabel}
					subtitle={subscriptionSubtitle}
					className="col-span-2 md:col-span-1"
				/>
			</div>
			{creditsLow ? (
				<Button
					variant="link"
					size="sm"
					className="self-end text-xs h-auto p-0 text-zinc-400 hover:text-zinc-200"
					onClick={() => navigate({ to: "/app/billing" })}
				>
					Top up
				</Button>
			) : null}
		</div>
	);
}
