import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/live")({
	head: () => ({
		meta: [{ name: "robots", content: "noindex" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
