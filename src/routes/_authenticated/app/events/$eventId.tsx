import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import type { EventSubmitData } from "#/components/authenticated/events/EventEditor";
import { EventEditor } from "#/components/authenticated/events/EventEditor";
import { ErrorView } from "#/components/error-view";
import { Spinner } from "#/components/ui/spinner";
import { parseStructuredError } from "#/lib/error-utils";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/app/events/$eventId")({
	component: EditRouteWrapper,
	errorComponent: ({ error, reset }) => {
		const router = useRouter();
		const errorData = parseStructuredError(error);
		return (
			<div className="flex  h-[calc(100vh-72px)]  items-center justify-center">
				<ErrorView
					title={errorData.title || "Something went wrong"}
					errorType={errorData.errorType}
					reason={
						errorData.reason ||
						"An unexpected error occurred while loading this event."
					}
					actionNeeded={
						errorData.actionNeeded || "Please try again or return to Events."
					}
					onBack={() => reset()}
					onHome={() =>
						router.navigate({
							to: "/app/events",
						})
					}
				/>
			</div>
		);
	},
});

// Wrapper to allow top-level suspense without blocking full shell
function EditRouteWrapper() {
	return (
		<Suspense
			fallback={
				<div className="w-full h-screen flex items-center justify-center bg-zinc-950">
					<Spinner className="size-8 text-zinc-700" />
				</div>
			}
		>
			<RouteComponent />
		</Suspense>
	);
}

function RouteComponent() {
	const navigate = useNavigate();
	const params = Route.useParams();
	const updateEvent = useMutation(api.events.update);

	// 1. Fetch data securely via local suspense
	const { data } = useSuspenseQuery(
		convexQuery(api.events.getDetails, {
			eventId: params.eventId as Id<"events">,
		}),
	);

	// 2. Standardized Global Header Assignment (HOISTED to obey Rules of Hooks!)
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);

	useEffect(() => {
		if (!data?.event) return; // Safely skip inside effect, not above it!
		setPageHeader({
			title: `Edit: ${data.event.title}`,
			showBackButton: true,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader, data?.event?.title, data?.event]);

	// 🛡️ Safety Guard: Now we can perform the early exit AFTER all hooks are registered!
	if (!data) return <div>Event not found</div>;
	const { event, sections, slots } = data;

	// 2. Transform Raw DB rows back into the format InitialData expects
	const initialData = {
		title: event.title,
		location: event.location,
		description: event.description,
		eventDate: event.eventDate,
		startTime: event.startTime,
		// Convert sections with safe fallbacks
		sections: sections.map((sec) => ({
			name: sec.name,
			startTime: sec.startTime ?? "",
			endTime: sec.endTime ?? "",
		})),
		// Map slots back to JobScopes by looking up parent section details!
		jobScopes: slots.map((slot) => {
			const parentSection = sections.find((s) => s._id === slot.sectionId);
			return {
				id: slot._id,
				section: parentSection?.name ?? "",
				role: slot.role,
				startTime: parentSection?.startTime ?? "",
				endTime: parentSection?.endTime ?? "",
				title: slot.title,
				description: slot.description ?? "",
			};
		}),
	};

	// 4. Handshake function to commit updates
	const handleUpdateEvent = async (submitData: EventSubmitData) => {
		try {
			await updateEvent({
				eventId: params.eventId as Id<"events">,
				...submitData,
			});

			toast.success("Event Updated Successfully!");

			// Navigate back to dashboard after successful save
			navigate({ to: "/app/events" });
		} catch (error: any) {
			console.error("Event update failed:", error);
			toast.error(
				error?.message || "Failed to save changes. Please try again.",
			);
			throw error; // Force EventEditor form status to acknowledge fail
		}
	};

	return (
		<EventEditor
			mode="edit"
			initialData={initialData}
			onSubmit={handleUpdateEvent}
		/>
	);
}
