import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountSection } from "#/components/settings/AccountSection";
import { DeleteAccountSection } from "#/components/settings/DeleteAccountSection";
import { PolarPortalSection } from "#/components/settings/PolarPortalSection";
import { PurchaseHistorySection } from "#/components/settings/PurchaseHistorySection";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { authClient } from "#/lib/auth-client";
import { clearSignedOutFlag, markSignedOut } from "#/lib/auth-session";
import { useHeaderStore } from "#/lib/store/topHeaderStore";

export const Route = createFileRoute("/_authenticated/app/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const navigate = useNavigate();
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);
	const [isSigningOut, setIsSigningOut] = useState(false);

	useEffect(() => {
		setPageHeader({
			title: "Settings",
			showBackButton: false,
			showLeftButton: false,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader]);

	const handleSignOut = async () => {
		setIsSigningOut(true);
		try {
			markSignedOut();
			navigate({ to: "/", replace: true });
			await authClient.signOut();
		} catch (err) {
			clearSignedOutFlag();
			toast.error(err instanceof Error ? err.message : "Failed to sign out");
		} finally {
			setIsSigningOut(false);
		}
	};

	return (
		<div className="spine space-y-8 text-white min-h-[calc(100vh-4rem)] pb-12">
			<div className="border-b border-zinc-800/80 py-6">
				<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
				<p className="text-sm text-zinc-400 mt-1">
					Account, purchases, and session preferences.
				</p>
			</div>

			<AccountSection />
			<PolarPortalSection />
			<PurchaseHistorySection />

			<Card className="bg-zinc-900/50 border-zinc-800 ring-zinc-800 text-white">
				<CardHeader>
					<CardTitle>Session</CardTitle>
					<CardDescription className="text-zinc-400">
						Sign out of Asistir on this device.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="outline"
						onClick={handleSignOut}
						disabled={isSigningOut}
						className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
					>
						<LogOut className="size-4 mr-2" />
						{isSigningOut ? "Signing out..." : "Sign out"}
					</Button>
				</CardContent>
			</Card>

			<DeleteAccountSection />
		</div>
	);
}
