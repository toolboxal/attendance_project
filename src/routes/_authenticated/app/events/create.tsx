import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { toastMutationError } from "#/lib/error-utils";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../../convex/_generated/api";
import { EventEditor } from "#/components/authenticated/events/EventEditor";
import type { EventSubmitData } from "#/components/authenticated/events/EventEditor";

export const Route = createFileRoute("/_authenticated/app/events/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const createEvent = useMutation(api.events.create);

	// 1. Standardized Global Header Assignment for this route
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);
	useEffect(() => {
		setPageHeader({
			title: "Create Event",
			showBackButton: true,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader]);

	// 2. Hook to pass into the decoupled EventEditor component
	const handleCreateEvent = async (data: EventSubmitData) => {
		try {
			await createEvent(data);

			toast.success("Event Draft Created Successfully!");

			// Immediate redirection, child editor handles logic gates automatically now
			navigate({ to: "/app/events" });
		} catch (error: unknown) {
			console.error("Event creation failed:", error);
			toastMutationError(error, "Failed to create event. Please try again.");
			// IMPORTANT: Re-throw so EventEditor form state knows submit failed
			throw error;
		}
	};

	return <EventEditor mode="create" onSubmit={handleCreateEvent} />;
}
