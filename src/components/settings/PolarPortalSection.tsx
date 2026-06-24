import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { authClient } from "#/lib/auth-client";

export function PolarPortalSection() {
	const [isLoading, setIsLoading] = useState(false);

	const handleOpenPortal = async () => {
		try {
			setIsLoading(true);
			const { data, error } = await authClient.customer.portal();

			if (error) {
				toast.error(error.message || "Failed to open customer portal");
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
				toast.error("Customer portal is currently unavailable.");
			}
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to redirect to customer portal",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="bg-zinc-900/50 border-zinc-800 ring-zinc-800 text-white">
			<CardHeader>
				<CardTitle>Customer portal</CardTitle>
				<CardDescription className="text-zinc-400">
					View invoices and update payment methods on Polar.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					onClick={handleOpenPortal}
					disabled={isLoading}
					variant="outline"
					className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
				>
					{isLoading ? (
						<RefreshCw className="animate-spin size-4 mr-2" />
					) : (
						<ExternalLink className="size-4 mr-2" />
					)}
					Open customer portal
				</Button>
			</CardContent>
		</Card>
	);
}
