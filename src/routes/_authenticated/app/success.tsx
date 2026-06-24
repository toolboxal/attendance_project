import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { authClient } from "#/lib/auth-client";
import {
	formatCurrency,
	formatPaymentDate,
	getFulfillmentText,
	inferPurchaseKind,
	type PurchaseKind,
} from "#/lib/payment-receipt";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../convex/_generated/api";

const CONFIRMATION_TIMEOUT_MS = 30_000;

export const Route = createFileRoute("/_authenticated/app/success")({
	validateSearch: (search: Record<string, unknown>) => ({
		checkout_id: (search.checkout_id as string) ?? undefined,
	}),
	component: SuccessPage,
});

function ReceiptRow({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: ReactNode;
	valueClassName?: string;
}) {
	return (
		<div className="flex justify-between gap-4">
			<span>{label}</span>
			<span
				className={`text-zinc-200 font-semibold text-right max-w-[60%] truncate ${valueClassName ?? ""}`}
			>
				{value}
			</span>
		</div>
	);
}

function MissingCheckoutState() {
	return (
		<div className="flex flex-col items-center gap-4 py-12 text-center">
			<p className="text-lg font-semibold text-zinc-200">No checkout found</p>
			<p className="text-sm text-zinc-500 max-w-sm">
				This page needs a checkout ID from your payment redirect. If you already
				paid, your credits may still be on your account.
			</p>
			<div className="flex flex-col gap-2.5 w-full max-w-xs mt-2 sm:flex-row sm:max-w-none sm:justify-center">
				<Button asChild size="lg">
					<Link to="/app/billing">View Billing</Link>
				</Button>
				<Button asChild size="lg" variant="outline">
					<Link to="/app/dashboard" search={{ checkoutSlug: undefined }}>
						Go to Dashboard
					</Link>
				</Button>
			</div>
		</div>
	);
}

function PendingConfirmationState({
	timedOut,
	onOpenPortal,
	isPortalLoading,
}: {
	timedOut: boolean;
	onOpenPortal: () => void;
	isPortalLoading: boolean;
}) {
	return (
		<div className="flex flex-col items-center gap-3 py-6 text-center">
			{!timedOut && <Spinner />}
			<p className="text-zinc-300 font-medium">
				{timedOut
					? "Payment confirmation is taking longer than expected"
					: "Waiting for payment confirmation..."}
			</p>
			<p className="text-xs text-zinc-500 max-w-sm">
				{timedOut
					? "If you were charged, your account may still update shortly. Check billing or open your purchase history."
					: "This usually takes a few seconds after checkout."}
			</p>
			{timedOut && (
				<div className="flex flex-col gap-2 w-full max-w-xs mt-2 sm:flex-row sm:max-w-none sm:justify-center">
					<Button size="lg" onClick={onOpenPortal} disabled={isPortalLoading}>
						{isPortalLoading ? "Loading..." : "Manage Purchases"}
						<ExternalLink size={14} className="ml-1.5" />
					</Button>
					<Button asChild size="lg" variant="outline">
						<Link to="/app/billing">View Billing</Link>
					</Button>
				</div>
			)}
		</div>
	);
}

function SuccessPage() {
	const { checkout_id } = Route.useSearch();
	const [isPortalLoading, setIsPortalLoading] = useState(false);
	const [confirmationTimedOut, setConfirmationTimedOut] = useState(false);
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);

	useEffect(() => {
		setPageHeader({
			title: "Payment confirmation",
			showBackButton: false,
			showLeftButton: false,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader]);

	const payment = useQuery(
		api.payments.getPaymentByCheckoutId,
		checkout_id ? { checkoutId: checkout_id } : "skip",
	);

	const isPaymentLoading = checkout_id !== undefined && payment === undefined;
	const isPendingConfirmation =
		checkout_id !== undefined && !isPaymentLoading && payment === null;

	useEffect(() => {
		if (!isPendingConfirmation) {
			setConfirmationTimedOut(false);
			return;
		}

		const timer = window.setTimeout(() => {
			setConfirmationTimedOut(true);
		}, CONFIRMATION_TIMEOUT_MS);

		return () => window.clearTimeout(timer);
	}, [isPendingConfirmation]);

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

	const purchaseKind: PurchaseKind | null = payment
		? inferPurchaseKind(payment.productName)
		: null;
	const paidOn = payment ? formatPaymentDate(payment.timestamp) : null;
	const hasDiscount = payment ? payment.discountAmount > 0 : false;

	return (
		<div className="w-full max-w-4xl mx-auto px-4 bg-zinc-950 text-white min-h-[calc(100vh-4rem)]">
			{!checkout_id ? (
				<MissingCheckoutState />
			) : (
				<>
					<div className="flex flex-col gap-1 pt-10 pb-6">
						<h1 className="text-xl font-bold text-zinc-100 tracking-tight">
							Thank You for Your Purchase
						</h1>
						<p className="text-sm text-zinc-400 font-light">
							Your account has been updated instantly.
						</p>
					</div>

					<div className="w-full bg-zinc-900/50 p-5 text-left flex flex-col gap-4 font-mono text-xs text-zinc-400">
						<div className="flex justify-between border-b border-zinc-800/60 pb-3 gap-4">
							<span>INVOICE: #{payment?.invoiceNo ?? "—"}</span>
							{paidOn && (
								<span className="text-zinc-500 text-right shrink-0">
									{paidOn}
								</span>
							)}
						</div>

						{isPaymentLoading ? (
							<div className="flex flex-col items-center justify-center py-4 gap-4 text-zinc-500">
								<Spinner />
								<span>Retrieving receipt details...</span>
							</div>
						) : payment ? (
							<>
								<div className="flex flex-col gap-2">
									<ReceiptRow
										label="Reference"
										value={payment.orderId}
										valueClassName="font-normal text-zinc-400 text-xs"
									/>
									<ReceiptRow label="Product" value={payment.productName} />
									{purchaseKind && (
										<ReceiptRow
											label="You received"
											value={getFulfillmentText(purchaseKind)}
											valueClassName="text-emerald-400/90"
										/>
									)}
									<ReceiptRow label="Status" value="PAID" />
								</div>

								<div className="border-t border-dashed border-zinc-800/80 pt-3 flex flex-col gap-2">
									{hasDiscount && (
										<>
											<div className="flex justify-between">
												<span>Subtotal</span>
												<span className="text-zinc-300">
													{formatCurrency(
														payment.totalAmount,
														payment.currency,
													)}
												</span>
											</div>
											<div className="flex justify-between">
												<span>Discount</span>
												<span className="text-emerald-400/90">
													-
													{formatCurrency(
														payment.discountAmount,
														payment.currency,
													)}
												</span>
											</div>
										</>
									)}
									<div className="flex justify-between text-sm font-semibold">
										<span>{hasDiscount ? "Total" : "Total Charged"}</span>
										<span className="text-yellow-100">
											{formatCurrency(
												hasDiscount ? payment.netAmount : payment.totalAmount,
												payment.currency,
											)}
										</span>
									</div>
								</div>
							</>
						) : (
							<PendingConfirmationState
								timedOut={confirmationTimedOut}
								onOpenPortal={handleOpenPortal}
								isPortalLoading={isPortalLoading}
							/>
						)}
					</div>

					{payment && (
						<div className="flex flex-col gap-2.5 w-full mt-6 md:flex-row md:justify-end">
							<Button
								variant="outline"
								size="lg"
								onClick={handleOpenPortal}
								disabled={isPortalLoading}
							>
								{isPortalLoading ? "Loading..." : "Manage Purchases"}
								<ExternalLink size={14} className="ml-1.5" />
							</Button>
							<Button asChild size="lg" variant="ghost">
								<Link to="/app/dashboard" search={{ checkoutSlug: undefined }}>
									Go to Dashboard
									<ArrowRight size={16} className="ml-1.5" />
								</Link>
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
