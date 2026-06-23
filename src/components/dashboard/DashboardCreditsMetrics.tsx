import { useNavigate } from "@tanstack/react-router";
import {
	CreditsMetricsPanel,
	type CreditsMetricsData,
} from "#/components/billing/CreditsMetricsPanel";
import { Button } from "#/components/ui/button";
import { isProSubscription } from "#/lib/billing-plan";

export type DashboardCredits = CreditsMetricsData;

type DashboardCreditsMetricsProps = {
	credits: DashboardCredits;
};

export function DashboardCreditsMetrics({ credits }: DashboardCreditsMetricsProps) {
	const navigate = useNavigate();
	const isSubscription = isProSubscription(credits.billingPlan);
	const totalCredits =
		credits.monthlyCredits + credits.oneTimeCredits + credits.freeTrialCredits;
	const creditsLow = totalCredits === 0 && !isSubscription;

	return (
		<div className="flex flex-col gap-2">
			<CreditsMetricsPanel {...credits} />
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
