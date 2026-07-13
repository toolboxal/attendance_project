import { createFileRoute, Outlet } from "@tanstack/react-router";
import NavBar from "@/components/public/navBar";

export const Route = createFileRoute("/(public)")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="min-h-dvh bg-zinc-950 relative flex flex-col">
			<NavBar />
			<div className="flex flex-1 flex-col min-h-0">
				<Outlet />
			</div>
		</div>
	);
}
