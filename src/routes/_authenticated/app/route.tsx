import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { AppSidebar } from "#/components/authenticated/app-sidebar";
import TopHeaderBar from "#/components/authenticated/topHeaderBar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/app")({
	component: RouteComponent,
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
		return <Navigate to="/" replace />;
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<div className="absolute top-17 z-999">
					<SidebarTrigger className="text-white hover:bg-white/10" />
				</div>
				<TopHeaderBar />
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
