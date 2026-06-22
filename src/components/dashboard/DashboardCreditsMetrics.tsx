import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { DashboardCreditsMetricCard } from "#/components/dashboard/DashboardCreditsMetricCard";
import { Button } from "#/components/ui/button";
import { capitalizeWords } from "#/lib/utils";

export type DashboardCredits = {
	monthlyCredits: number;
	oneTimeCredits: number;
	freeTrialCredits: number;
	billingPlan: string;
	subscriptionExpiresAt: number | null;
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
	const isPro = credits.billingPlan === "pro_monthly";
	const totalCredits =
		credits.monthlyCredits + credits.oneTimeCredits + credits.freeTrialCredits;
	const creditsLow = totalCredits === 0 && !isPro;

	const monthlyPeriodEndLabel = formatBillingDate(credits.subscriptionExpiresAt);
	const renewalLabel = formatBillingDate(credits.subscriptionExpiresAt);

	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<DashboardCreditsMetricCard
					label="Monthly credits"
					value={credits.monthlyCredits}
					subtitle={
						isPro && monthlyPeriodEndLabel
							? `Renews via Polar · period ends ${monthlyPeriodEndLabel}`
							: "Pro subscription only"
					}
				/>
				<DashboardCreditsMetricCard
					label="Purchased credits"
					value={credits.oneTimeCredits}
					subtitle="Single pass & bundles"
				/>
				<DashboardCreditsMetricCard
					label="Free trial"
					value={credits.freeTrialCredits}
					subtitle="Up to 5 staff per event"
				/>
				<DashboardCreditsMetricCard
					label={isPro ? "Subscription" : "Plan"}
					value={
						isPro
							? "Pro"
							: capitalizeWords(credits.billingPlan.replace(/_/g, " "))
					}
					subtitle={
						isPro && renewalLabel
							? `Renews ${renewalLabel}`
							: "No active subscription"
					}
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
