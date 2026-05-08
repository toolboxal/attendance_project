import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/events/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="w-full min-h-dvh bg-amber-800">
			<div className="spine flex flex-col bg-zinc-950 h-full">
				<Link to="/app/events/create">Create Event</Link>
			</div>
		</div>
	);
}
