import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/live/_dashboard/")({
	component: () => <Navigate to="/live/jobs" replace />,
});
