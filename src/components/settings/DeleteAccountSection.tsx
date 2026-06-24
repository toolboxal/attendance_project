import { useQuery } from "convex/react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";
import { api } from "../../../convex/_generated/api";

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountSection() {
	const deleteStatus = useQuery(api.users.canDeleteAccount);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);
	const [isPortalLoading, setIsPortalLoading] = useState(false);

	const canConfirm = confirmText === CONFIRM_TEXT;
	const isBlocked = deleteStatus !== undefined && !deleteStatus.allowed;

	const handleOpenPortal = async () => {
		try {
			setIsPortalLoading(true);
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
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to open customer portal",
			);
		} finally {
			setIsPortalLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const { error } = await authClient.deleteUser();
			if (error) {
				toast.error(error.message || "Failed to delete account");
				return;
			}

			setDialogOpen(false);
			toast.success("Check your email for a link to confirm account deletion.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete account",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Card className="bg-zinc-900/50 border-red-900/40 ring-red-900/30 text-white">
			<CardHeader>
				<CardTitle className="text-red-400">Danger zone</CardTitle>
				<CardDescription className="text-zinc-400">
					Permanently delete your account and all associated event data.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{deleteStatus?.reason ? (
					<p className="text-sm text-amber-400/90">{deleteStatus.reason}</p>
				) : null}

				<ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4">
					<li className="text-red-200">
						All events, staff records, and event data will be removed.
					</li>
					<li className="text-red-200">
						Unused credits are forfeited with no refund.
					</li>
				</ul>

				<Button
					variant="destructive"
					disabled={isBlocked}
					onClick={() => {
						setConfirmText("");
						setDialogOpen(true);
					}}
				>
					Delete account
				</Button>
			</CardContent>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100">
					<DialogHeader>
						<DialogTitle className="text-red-400 font-bold">
							Delete account
						</DialogTitle>
						<DialogDescription asChild>
							<div className="text-zinc-400 space-y-3 text-sm">
								<p>
									This action is permanent. We will email you a confirmation
									link before your account is deleted.
								</p>
								{deleteStatus?.hasActiveSubscription ? (
									<div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-amber-200">
										<p className="mb-2">
											Cancel your subscription in the customer portal first.
										</p>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={handleOpenPortal}
											disabled={isPortalLoading}
											className="border-amber-800/50"
										>
											{isPortalLoading ? (
												<RefreshCw className="animate-spin size-3.5 mr-1.5" />
											) : (
												<ExternalLink className="size-3.5 mr-1.5" />
											)}
											Open customer portal
										</Button>
									</div>
								) : null}
								<div className="space-y-2">
									<p className="text-xs text-zinc-500">
										Type{" "}
										<span className="font-mono text-zinc-300">
											{CONFIRM_TEXT}
										</span>{" "}
										to confirm
									</p>
									<Input
										value={confirmText}
										onChange={(e) => setConfirmText(e.target.value)}
										placeholder={CONFIRM_TEXT}
										className="bg-zinc-950 border-zinc-800"
										autoComplete="off"
									/>
								</div>
							</div>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-2">
						<Button
							variant="ghost"
							onClick={() => setDialogOpen(false)}
							className="text-zinc-400"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={!canConfirm || isDeleting || isBlocked}
							onClick={handleDelete}
						>
							{isDeleting ? "Sending..." : "Delete my account"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
