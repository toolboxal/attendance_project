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
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export const Route = createFileRoute(
	"/_authenticated/app/events/$eventId/edit",
)({
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

	const { data } = useSuspenseQuery(
		convexQuery(api.events.getDetails, {
			eventId: params.eventId as Id<"events">,
		}),
	);

	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);

	useEffect(() => {
		if (!data?.event) return;
		setPageHeader({
			title: `Edit: ${data.event.title}`,
			showBackButton: true,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader, data?.event?.title, data?.event]);

	if (!data) return <div>Event not found</div>;
	const { event, sections, slots } = data;

	const initialData = {
		title: event.title,
		location: event.location,
		description: event.description,
		eventDate: event.eventDate,
		startTime: event.startTime,
		sections: sections.map((sec) => ({
			name: sec.name,
			startTime: sec.startTime ?? "",
			endTime: sec.endTime ?? "",
		})),
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

	const handleUpdateEvent = async (submitData: EventSubmitData) => {
		try {
			await updateEvent({
				eventId: params.eventId as Id<"events">,
				...submitData,
			});

			toast.success("Event Updated Successfully!");

			navigate({ to: "/app/events" });
		} catch (error: unknown) {
			console.error("Event update failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save changes. Please try again.",
			);
			throw error;
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
