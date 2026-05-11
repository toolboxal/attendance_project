import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "#/components/ui/button";
import { useHeaderStore } from "#/lib/store/topHeaderStore";

export const Route = createFileRoute("/_authenticated/app/events/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);
	useEffect(() => {
		setPageHeader({
			title: "Events",
			showBackButton: false,
			showLeftButton: true,
			leftButton: (
				<Button
					variant={"default"}
					onClick={() => navigate({ to: "/app/events/create" })}
				>
					Create Event
				</Button>
			),
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader, navigate]);
	return (
		<div className="w-full min-h-dvh bg-amber-800">
			<div className="spine flex flex-col bg-zinc-950 h-full justify-center items-center">
				<Link to="/app/events/create">Create Event</Link>
			</div>
		</div>
	);
}
