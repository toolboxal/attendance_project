import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowRight,
	CheckCircle,
	ExternalLink,
	Loader2,
	Receipt,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/app/success")({
	validateSearch: (search: Record<string, unknown>) => ({
		checkout_id: (search.checkout_id as string) ?? undefined,
	}),
	component: SuccessPage,
});

function SuccessPage() {
	const { checkout_id } = Route.useSearch();
	const [isPortalLoading, setIsPortalLoading] = useState(false);

	// Reactive database query (automatically streams details the exact millisecond the webhook completes)
	const payment = useQuery(
		api.payments.getPaymentByCheckoutId,
		checkout_id ? { checkoutId: checkout_id } : "skip",
	);

	const isCheckoutLoading = payment === undefined;

	const handleOpenPortal = async () => {
		setIsPortalLoading(true);
		try {
			const { data, error } = await authClient.customer.portal();
			if (error) {
				toast.error(error.message || "Failed to open billing portal");
				return;
			}
			if (data?.url) {
				window.open(data.url, "_blank");
			} else {
				toast.error("No portal URL was returned.");
			}
		} catch (error) {
			toast.error(
				`An unexpected error occurred while reaching the billing portal. ${error}`,
			);
		} finally {
			setIsPortalLoading(false);
		}
	};

	const formatAmount = (amount: number, currency: string) => {
		// Polar amounts are in cents (e.g. 2500 cents = $25.00)
		const value = amount / 100;
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
		}).format(value);
	};

	return (
		<div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white min-h-[calc(100vh-4rem)]">
			<div className="flex flex-col items-center gap-6 text-center max-w-md w-full px-8 py-10 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-2xl backdrop-blur-md">
				{/* Success Check Badge */}
				<div className="rounded-full bg-emerald-500/10 p-5 animate-in zoom-in duration-500">
					<CheckCircle size={44} className="text-emerald-400 animate-pulse" />
				</div>

				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
						Payment Confirmed!
					</h1>
					<p className="text-sm text-zinc-400 font-light">
						Thank you for your purchase. Your account has been updated
						instantly.
					</p>
				</div>

				{/* Beautiful Live Receipt Section */}
				<div className="w-full rounded-xl bg-zinc-950/50 border border-zinc-800/50 p-5 text-left flex flex-col gap-4 font-mono text-xs text-zinc-400">
					<div className="flex justify-between border-b border-zinc-800/60 pb-3">
						<span className="flex items-center gap-1.5">
							<Receipt size={14} /> RECEIPT
						</span>
						<span className="text-zinc-500">
							#
							{payment?.orderId
								? payment.orderId.slice(-8).toUpperCase()
								: checkout_id
									? checkout_id.slice(-8).toUpperCase()
									: "PENDING"}
						</span>
					</div>

					{isCheckoutLoading ? (
						<div className="flex flex-col items-center justify-center py-4 gap-2 text-zinc-500">
							<Loader2 size={16} className="animate-spin text-emerald-400" />
							<span>Retrieving receipt details...</span>
						</div>
					) : payment ? (
						<>
							<div className="flex flex-col gap-2">
								<div className="flex justify-between">
									<span>Product</span>
									<span className="text-zinc-200 font-semibold max-w-50 truncate text-right">
										{payment.productName}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Status</span>
									<span className="text-emerald-400 font-semibold">PAID</span>
								</div>
								<div className="flex justify-between">
									<span>Fulfillment</span>
									<span className="text-zinc-300">Credits Granted</span>
								</div>
							</div>

							<div className="border-t border-dashed border-zinc-800/80 pt-3 flex justify-between text-sm font-semibold text-zinc-200">
								<span>Total Charged</span>
								<span className="text-emerald-400">
									{formatAmount(payment.netAmount, payment.currency)}
								</span>
							</div>
						</>
					) : (
						<div className="text-center py-4 text-zinc-500">
							<span>Waiting for payment confirmation...</span>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col gap-2.5 w-full mt-2">
					<Link to="/app/dashboard" search={{ checkoutSlug: undefined }}>
						<Button
							size="lg"
							className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium"
						>
							Go to Dashboard <ArrowRight size={16} className="ml-1.5" />
						</Button>
					</Link>

					<Button
						variant="outline"
						size="lg"
						onClick={handleOpenPortal}
						disabled={isPortalLoading}
						className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white"
					>
						{isPortalLoading ? "Loading..." : "Manage Purchases"}{" "}
						<ExternalLink size={14} className="ml-1.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}
