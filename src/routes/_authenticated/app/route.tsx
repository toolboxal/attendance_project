import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";

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
		return <Navigate to="/signin" />;
	}

	return (
		<div>
			<Outlet />
		</div>
	);
}
