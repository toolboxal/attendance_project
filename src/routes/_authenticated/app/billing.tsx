import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import {
	ArrowUpRight,
	Calendar,
	Check,
	CreditCard,
	InfinityIcon,
	RefreshCw,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/app/billing")({
	component: BillingComponent,
});

function BillingComponent() {
	const user = useQuery(api.auth.getCurrentUser);
	const evaluateStatus = useMutation(api.payments.evaluateUserStatus);

	const [isPortalLoading, setIsPortalLoading] = useState(false);
	const [activeCheckoutSlug, setActiveCheckoutSlug] = useState<string | null>(
		null,
	);

	// 🚀 JIT (Just-in-Time) Status/Credit Evaluation on mount
	useEffect(() => {
		if (user) {
			const now = Date.now();
			const isSubActive = user.billingPlan === "pro_monthly";
			const isExpired =
				isSubActive &&
				user.subscriptionExpiresAt &&
				now >= user.subscriptionExpiresAt;
			const isResetDue =
				isSubActive &&
				user.monthlyCreditsResetAt &&
				now >= user.monthlyCreditsResetAt;

			if (isExpired || isResetDue) {
				evaluateStatus({ authUserId: user.authUserId });
			}
		}
	}, [user, evaluateStatus]);

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="flex flex-col items-center gap-2">
					<RefreshCw className="animate-spin text-zinc-500 size-6" />
					<p className="text-zinc-400 text-sm">Loading billing profile...</p>
				</div>
			</div>
		);
	}

	// Helper to format timestamps to readable dates
	const formatDate = (timestamp?: number) => {
		if (!timestamp) return "N/A";
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Trigger Polar checkout flow
	const handlePurchase = async (slug: "single" | "weekend" | "monthly") => {
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
			toast.error("An unexpected error occurred. Please try again.");
		} finally {
			setActiveCheckoutSlug(null);
		}
	};

	// Open Polar self-service billing customer portal
	const handleManageBilling = async () => {
		try {
			setIsPortalLoading(true);
			// Better Auth customerPortal utilizes the portal() plugin on the server
			const { data, error } = await authClient.customer.portal();

			if (error) {
				toast.error(error.message || "Failed to open billing portal");
				return;
			}

			if (data?.url) {
				window.location.href = data.url;
			} else {
				toast.error("Billing portal is currently unavailable.");
			}
		} catch (err) {
			toast.error("Failed to redirect to billing portal.");
		} finally {
			setIsPortalLoading(false);
		}
	};

	const isProSubscriber = user.billingPlan === "pro_monthly";

	return (
		<div className="flex-1 p-6 space-y-8 bg-zinc-950 text-white min-h-[calc(100vh-4rem)]">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800/80 pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Billing & Subscriptions
					</h1>
					<p className="text-sm text-zinc-400 mt-1">
						Manage your plans, credits, and download PDF receipts.
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
						Manage Subscription & Invoices
					</Button>
				)}
			</div>

			{/* Grid of Credit Pools */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Card 1: Subscription Credits */}
				<div className="relative overflow-hidden rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-6 flex flex-col justify-between gap-6">
					<div className="space-y-2">
						<div className="flex justify-between items-start">
							<span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
								Monthly Pool
							</span>
							<Calendar className="size-4 text-zinc-500" />
						</div>
						<h3 className="text-2xl font-bold font-mono">
							{user.monthlyCredits ?? 0}{" "}
							<span className="text-sm font-normal text-zinc-400">/ 8</span>
						</h3>
						<p className="text-xs text-zinc-400">
							Subscription credits for live Pro event sessions.
						</p>
					</div>
					<div className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-500 flex justify-between">
						<span>Next Reset:</span>
						<span className="font-medium text-zinc-300">
							{isProSubscriber ? formatDate(user.monthlyCreditsResetAt) : "N/A"}
						</span>
					</div>
				</div>

				{/* Card 2: One-Time Credits */}
				<div className="relative overflow-hidden rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-6 flex flex-col justify-between gap-6">
					<div className="space-y-2">
						<div className="flex justify-between items-start">
							<span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
								Lifetime Pool
							</span>
							<InfinityIcon className="size-4 text-zinc-500" />
						</div>
						<h3 className="text-2xl font-bold font-mono">
							{user.oneTimeCredits ?? 0}
						</h3>
						<p className="text-xs text-zinc-400">
							Permanent credits purchased as bundles. Never expire.
						</p>
					</div>
					<div className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-500 flex justify-between">
						<span>Expiration:</span>
						<span className="font-medium text-zinc-300 flex items-center gap-1">
							Never Expires
						</span>
					</div>
				</div>

				{/* Card 3: Billing Plan Summary */}
				<div className="relative overflow-hidden rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-6 flex flex-col justify-between gap-6 md:col-span-2 lg:col-span-1">
					<div className="space-y-2">
						<div className="flex justify-between items-start">
							<span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
								Billing Plan
							</span>
							<ShieldCheck className="size-4 text-zinc-500" />
						</div>
						<h3 className="text-lg font-bold capitalize flex items-center gap-2">
							{user.billingPlan?.replace(/_/g, " ") || "Free"}
							{isProSubscriber && (
								<span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
									Active
								</span>
							)}
						</h3>
						<p className="text-xs text-zinc-400">
							{isProSubscriber
								? "You have full access to Pro features with monthly auto-renewal."
								: "Upgrade to Pro Monthly or buy credit bundles to start running live events."}
						</p>
					</div>
					<div className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-500 flex justify-between">
						<span>Renewal Date:</span>
						<span className="font-medium text-zinc-300">
							{isProSubscriber ? formatDate(user.subscriptionExpiresAt) : "N/A"}
						</span>
					</div>
				</div>
			</div>

			{/* Upgrade / Purchase Packages */}
			<div className="space-y-6">
				<div className="flex items-center gap-2">
					<Sparkles className="size-4 text-amber-400" />
					<h2 className="text-lg font-semibold">
						Available Products & Upgrades
					</h2>
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					{/* Package 1: Single Pass */}
					<div className="rounded-xl bg-zinc-900/30 border border-zinc-800/80 p-6 flex flex-col justify-between gap-6 relative group hover:border-zinc-700/80 transition-all duration-300">
						<div className="space-y-4">
							<div>
								<h3 className="text-base font-semibold">Single Pass</h3>
								<p className="text-xs text-zinc-500 mt-1">
									Perfect for trial or infrequent events.
								</p>
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-3xl font-extrabold font-mono">$9.00</span>
								<span className="text-xs text-zinc-500">/ event</span>
							</div>
							<ul className="space-y-2 text-xs text-zinc-400">
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> 1 Pro Event
									Credit
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> 24-hour active
									live session
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> Lifetime
									validity (no expiration)
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handlePurchase("single")}
							disabled={activeCheckoutSlug !== null}
							variant="outline"
							className="w-full border-zinc-800 hover:bg-zinc-900 text-xs font-semibold"
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

					{/* Package 2: Weekend Bundle */}
					<div className="rounded-xl bg-zinc-900/30 border border-zinc-800/80 p-6 flex flex-col justify-between gap-6 relative group hover:border-zinc-700/80 transition-all duration-300">
						<div className="absolute -top-3 right-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-3xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
							Popular Value
						</div>
						<div className="space-y-4">
							<div>
								<h3 className="text-base font-semibold">Weekend Bundle</h3>
								<p className="text-xs text-zinc-500 mt-1">
									Perfect for multi-day festivals or tournaments.
								</p>
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-3xl font-extrabold font-mono">
									$25.00
								</span>
								<span className="text-xs text-zinc-500">/ 3 credits</span>
							</div>
							<ul className="space-y-2 text-xs text-zinc-400">
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> 3 Pro Event
									Credits
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> Save 8% vs
									Single Passes
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> Lifetime
									validity (no expiration)
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handlePurchase("weekend")}
							disabled={activeCheckoutSlug !== null}
							variant="outline"
							className="w-full border-zinc-800 hover:bg-zinc-900 text-xs font-semibold"
						>
							{activeCheckoutSlug === "weekend" ? (
								<RefreshCw className="animate-spin size-3" />
							) : (
								<span className="flex items-center justify-center gap-1">
									Purchase Bundle <ArrowUpRight className="size-3" />
								</span>
							)}
						</Button>
					</div>

					{/* Package 3: Pro Monthly */}
					<div className="rounded-xl bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 border border-emerald-500/30 p-6 flex flex-col justify-between gap-6 relative group hover:border-emerald-500/50 transition-all duration-300 shadow-lg shadow-emerald-500/5">
						<div className="absolute -top-3 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-3xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
							Best Deal
						</div>
						<div className="space-y-4">
							<div>
								<h3 className="text-base font-semibold text-emerald-400 flex items-center gap-1.5">
									Pro Monthly <Sparkles className="size-3.5 fill-emerald-400" />
								</h3>
								<p className="text-xs text-zinc-500 mt-1">
									Best for regular recurring event organizers.
								</p>
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-3xl font-extrabold font-mono">
									$39.00
								</span>
								<span className="text-xs text-zinc-500">/ month</span>
							</div>
							<ul className="space-y-2 text-xs text-zinc-400">
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> 8 Pro Event
									Credits / month
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> Save 45% vs
									Single Passes
								</li>
								<li className="flex items-center gap-2">
									<Check className="size-3 text-emerald-400" /> Automatic
									billing & invoice portal
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handlePurchase("monthly")}
							disabled={activeCheckoutSlug !== null || isProSubscriber}
							className={`w-full text-xs font-semibold flex items-center justify-center gap-1 ${
								isProSubscriber
									? "bg-zinc-800 text-zinc-500 cursor-not-allowed border-none hover:bg-zinc-800"
									: "bg-emerald-500 hover:bg-emerald-600 text-black hover:text-black"
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
