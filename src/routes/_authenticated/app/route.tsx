import {
	createFileRoute,
	Navigate,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { AppSidebar } from "#/components/authenticated/app-sidebar";
import { ErrorView } from "#/components/error-view";
import TopHeaderBar from "#/components/authenticated/topHeaderBar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/app")({
	component: RouteComponent,
	notFoundComponent: () => {
		const router = useRouter();
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<ErrorView
					reason="Item Not Found"
					actionNeeded="The event, job, or setting you are trying to access is not available at this time."
					onHome={() =>
						router.navigate({
							to: "/app/dashboard",
							search: { checkoutSlug: undefined },
						})
					}
				/>
			</div>
		);
	},
	errorComponent: ({ error, reset }) => {
		const router = useRouter();
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<ErrorView
					title="Something went wrong"
					reason={error instanceof Error ? error.message : "An unexpected error occurred while loading this page."}
					actionNeeded="Please try again or return to the dashboard."
					onBack={() => reset()}
					onHome={() =>
						router.navigate({
							to: "/app/dashboard",
							search: { checkoutSlug: undefined },
						})
					}
				/>
			</div>
		);
	},
});

function RouteComponent() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-zinc-400">Verifying session...</p>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/signin" />;
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<div className="absolute top-20 left-2 z-999">
					<SidebarTrigger className="text-white hover:bg-white/10" />
				</div>
				<TopHeaderBar />
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
