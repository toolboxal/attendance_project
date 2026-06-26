export type PurchaseKind = "single" | "bundle" | "monthly" | "unknown";

export function inferPurchaseKind(productName: string): PurchaseKind {
	const name = productName.toLowerCase();
	if (name.includes("monthly") || name.includes("pro monthly"))
		return "monthly";
	if (name.includes("bundle")) return "bundle";
	if (name.includes("single")) return "single";
	return "unknown";
}

export function getFulfillmentText(kind: PurchaseKind): string {
	switch (kind) {
		case "single":
			return "1 event credit";
		case "bundle":
			return "4 event credits";
		case "monthly":
			return "8 credits/month";
		default:
			return "Account updated";
	}
}

export function formatPaymentDate(
	timestamp: string | undefined,
): string | null {
	if (!timestamp) return null;
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function formatCurrency(amountCents: number, currency: string): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency.toUpperCase(),
	}).format(amountCents / 100);
}
