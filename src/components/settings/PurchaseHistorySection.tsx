import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Spinner } from "#/components/ui/spinner";
import {
	formatCurrency,
	formatPaymentDate,
	getFulfillmentText,
	inferPurchaseKind,
} from "#/lib/payment-receipt";
import { api } from "../../../convex/_generated/api";

export function PurchaseHistorySection() {
	const payments = useQuery(api.payments.listPayments);

	return (
		<Card className="bg-zinc-900/50 border-zinc-800 ring-zinc-800 text-white">
			<CardHeader>
				<CardTitle>Purchase history</CardTitle>
				<CardDescription className="text-zinc-400">
					Your five most recent orders. For full invoices, use the customer
					portal above.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{payments === undefined ? (
					<div className="flex justify-center py-8">
						<Spinner />
					</div>
				) : payments.length === 0 ? (
					<div className="text-center py-8 space-y-3">
						<p className="text-sm text-zinc-400">No purchases yet.</p>
						<Button asChild variant="outline" size="sm">
							<Link to="/app/billing">View billing</Link>
						</Button>
					</div>
				) : (
					<ul className="divide-y divide-zinc-800">
						{payments.map((payment) => {
							const dateLabel =
								formatPaymentDate(payment.timestamp) ?? "Unknown date";

							return (
								<li
									key={payment._id}
									className="py-1.5 flex gap-1 flex-row items-start justify-between border-t border-zinc-700"
								>
									<div className="min-w-0">
										<p className="font-medium text-zinc-100 truncate">
											{payment.productName}
										</p>
										<p className="text-xs text-zinc-500">{dateLabel}</p>
									</div>
									<p className="text-sm font-semibold text-zinc-200 shrink-0">
										{formatCurrency(payment.totalAmount, payment.currency)}
									</p>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
