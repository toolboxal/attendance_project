import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<h1>Authenticated layout</h1>
			<Outlet />
		</div>
	);
}
