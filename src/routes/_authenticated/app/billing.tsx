import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowUpRight, Check, CreditCard, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditsMetricsPanel } from "#/components/billing/CreditsMetricsPanel";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { authClient } from "#/lib/auth-client";
import { isProSubscription } from "#/lib/billing-plan";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/app/billing")({
	loader: () => {
		useHeaderStore.getState().setPageHeader({
			title: "Subscriptions",
			showBackButton: false,
			showLeftButton: false,
		});
	},
	component: BillingComponent,
});

function BillingComponent() {
	const billing = useQuery(api.payments.getBillingProfile);
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);

	const [isPortalLoading, setIsPortalLoading] = useState(false);
	const [activeCheckoutSlug, setActiveCheckoutSlug] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setPageHeader({
			title: "Subscriptions",
			showBackButton: false,
			showLeftButton: false,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader]);

	if (!billing) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="flex flex-col items-center gap-6">
					<Spinner />
					<p className="text-zinc-400 text-sm">Loading billing profile...</p>
				</div>
			</div>
		);
	}

	const handlePurchase = async (slug: "single" | "bundle" | "monthly") => {
		try {
			setActiveCheckoutSlug(slug);
			const { data, error } = await authClient.checkout({ slug });

			if (error) {
				toast.error(error.message || "Failed to initiate checkout");
				return;
			}

			if (data?.url) {
				window.location.href = data.url;
			}
		} catch (err) {
			toast.error(`An unexpected error occurred. Please try again. ${err}`);
		} finally {
			setActiveCheckoutSlug(null);
		}
	};

	const handleManageBilling = async () => {
		try {
			setIsPortalLoading(true);
			const { data, error } = await authClient.customer.portal();

			if (error) {
				toast.error(error.message || "Failed to open billing portal");
				return;
			}

			if (data?.url) {
				const opened = window.open(data.url, "_blank", "noopener,noreferrer");
				if (!opened) {
					toast.error(
						"Could not open a new tab. Allow pop-ups for this site and try again.",
					);
				}
			} else {
				toast.error("Billing portal is currently unavailable.");
			}
		} catch (err) {
			toast.error(`Failed to redirect to billing portal. ${err}`);
		} finally {
			setIsPortalLoading(false);
		}
	};

	const isProSubscriber = isProSubscription(billing.billingPlan);
	const isPendingCancellation = billing.subscriptionCancelAtPeriodEnd;

	return (
		<div className="spine space-y-8 text-white min-h-[calc(100vh-4rem)] pb-10">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800/80 py-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Subscriptions & Current Plan
					</h1>
					<p className="text-sm text-zinc-400 mt-1">
						Manage your plan and credits.
					</p>
				</div>

				{isProSubscriber && (
					<Button
						onClick={handleManageBilling}
						disabled={isPortalLoading}
						variant="outline"
						className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-2"
					>
						{isPortalLoading ? (
							<RefreshCw className="animate-spin size-4" />
						) : (
							<CreditCard className="size-4" />
						)}
						{isPendingCancellation
							? "Manage Subscription (Polar Portal)"
							: "Cancel or Manage Subscription"}
					</Button>
				)}
			</div>

			<CreditsMetricsPanel {...billing} />

			<div className="space-y-6">
				<h2 className="text-lg font-semibold">Available Products & Upgrades</h2>

				<div className="flex flex-col gap-4 md:flex-row">
					<div className="p-6 flex flex-1 flex-col justify-between gap-8">
						<div className="space-y-4">
							<div>
								<h3 className="text-base font-semibold">Single Pass</h3>
								<p className="text-xs text-zinc-400 mt-1">
									Perfect for single event like wedding or seminar.
								</p>
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-2xl font-extrabold font-mono">$9.00</span>
								<span className="text-xs text-zinc-500">/ event</span>
							</div>
							<ul className="space-y-4 text-xs text-zinc-400">
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> 1 Pro Event
									Credit
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> 5 drafts · 1
									live · 10 past events
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> Lifetime validity
									(no expiration)
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handlePurchase("single")}
							disabled={activeCheckoutSlug !== null}
							variant="default"
							className="w-full hover:bg-zinc-100 text-xs font-semibold"
						>
							{activeCheckoutSlug === "single" ? (
								<RefreshCw className="animate-spin size-3" />
							) : (
								<span className="flex items-center justify-center gap-1">
									Purchase Pass <ArrowUpRight className="size-3" />
								</span>
							)}
						</Button>
					</div>

					<div className="p-6 flex flex-1 flex-col justify-between gap-8">
						<div className="space-y-4">
							<div>
								<h3 className="text-base font-semibold">Bundle</h3>
								<p className="text-xs text-zinc-400 mt-1">
									Best for ~one event per week (~4 per month).
								</p>
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-2xl font-extrabold font-mono">
									$30.00
								</span>
								<span className="text-xs text-zinc-500">/ 4 credits</span>
							</div>
							<ul className="space-y-4 text-xs text-zinc-400">
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> 4 Pro Event
									Credits
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> 5 drafts · 1
									live · 10 past events
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> Lifetime validity
									(no expiration)
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handlePurchase("bundle")}
							disabled={activeCheckoutSlug !== null}
							variant="default"
							className="w-full hover:bg-zinc-100 text-xs font-semibold"
						>
							{activeCheckoutSlug === "bundle" ? (
								<RefreshCw className="animate-spin size-3" />
							) : (
								<span className="flex items-center justify-center gap-1">
									Purchase Bundle <ArrowUpRight className="size-3" />
								</span>
							)}
						</Button>
					</div>

					<div className="p-6 flex flex-1 flex-col justify-between gap-8">
						<div className="space-y-4">
							<div>
								<div className="flex items-start gap-2">
									<h3 className="text-base font-semibold">Pro Monthly</h3>
									{isProSubscriber && (
										<span className="flex justify-center items-center px-2 py-1 rounded-full bg-indigo-300 text-indigo-900 text-[9px] font-semibold w-fit h-fit text-nowrap">
											current plan
										</span>
									)}
								</div>
								<p className="text-xs text-zinc-400 mt-1">
									Best for regular recurring event organizers.
								</p>
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-2xl font-extrabold font-mono">
									$49.00
								</span>
								<span className="text-xs text-zinc-500">/ month</span>
							</div>
							<ul className="space-y-4 text-xs text-zinc-400">
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> 8 Pro Event
									Credits / month
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> 5 drafts · 1
									live · 10 past events
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-yellow-300" /> Automatic billing
									& invoice portal
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handlePurchase("monthly")}
							disabled={activeCheckoutSlug !== null || isProSubscriber}
							className={`w-full text-xs font-semibold flex items-center justify-center gap-1 ${
								isProSubscriber
									? "bg-zinc-800 text-zinc-500 cursor-not-allowed border-none"
									: "bg-yellow-200 hover:bg-yellow-100 text-black hover:text-black"
							}`}
						>
							{activeCheckoutSlug === "monthly" ? (
								<RefreshCw className="animate-spin size-3" />
							) : isProSubscriber ? (
								"Currently Subscribed"
							) : (
								<span className="flex items-center justify-center gap-1">
									Upgrade to Pro <ArrowUpRight className="size-3" />
								</span>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
