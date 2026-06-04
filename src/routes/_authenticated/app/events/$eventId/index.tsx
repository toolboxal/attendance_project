import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/events/$eventId/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/app/events/$eventId/edit",
			params: { eventId: params.eventId },
		});
	},
});
