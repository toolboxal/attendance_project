import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CheckCircle2Icon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_authenticated/app/dashboard")({
	validateSearch: (search: Record<string, unknown>) => ({
		checkout_success: search.checkout_success as boolean | undefined,
	}),
	component: DashboardComponent,
});

function DashboardComponent() {
	const { checkout_success } = Route.useSearch();
	const router = useRouter();

	useEffect(() => {
		if (checkout_success) {
			toast.success("Payment Successful! Your credits have been added.", {
				icon: <CheckCircle2Icon className="fill-green-500" />,
			});
			// Clean up the URL
			router.navigate({
				to: "/app/dashboard",
				search: { checkout_success: undefined },
				replace: true,
			});
		}
	}, [checkout_success, router]);

	const handleSignOut = async () => {
		try {
			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						window.location.href = "/";
						toast.success("Logged out.");
					},
				},
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to sign out";
			toast.error(errorMessage);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-zinc-950 text-white">
			<div className="text-center">
				<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
					Dashboard
				</h1>
				<p className="mt-2 text-zinc-400">Welcome to your secure area.</p>
			</div>

			<Button
				onClick={handleSignOut}
				variant="outline"
				className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
			>
				Sign Out
			</Button>
		</div>
	);
}
