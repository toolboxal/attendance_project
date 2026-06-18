import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { format } from "date-fns";
import { Suspense, useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { ErrorView } from "#/components/error-view";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { parseStructuredError } from "#/lib/error-utils";
import { formatTime12h, eventDateFromMs } from "#/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import { EventDetailsView } from "#/components/authenticated/events/EventDetailsView";

export const Route = createFileRoute("/_authenticated/app/events/")({
	component: RouteComponent,
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
						"An unexpected error occurred while loading events."
					}
					actionNeeded={
						errorData.actionNeeded ||
						"Please try again or return to the dashboard."
					}
					onBack={() => reset()}
					onHome={() =>
						router.navigate({
							to: "/app/dashboard",
							search: { checkoutSlug: undefined },
						})
					}
				/>
			</div>
		);
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);
	const { data: events } = useSuspenseQuery(convexQuery(api.events.list, {}));

	const [selectedEvent, setSelectedEvent] = useState<string | undefined>(
		events[0]?._id,
	);

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
		<div className="w-full min-h-dvh bg-zinc-950">
			<div className="spine flex flex-col md:flex-row h-full py-2 gap-2">
				<section className="flex-none md:w-60 bg-zinc-800/20 border border-zinc-800/50 rounded-xl">
					<div className="p-2 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto scrollbar-hide">
						{events.map((event) => (
							<button
								type="button"
								key={event._id}
								onClick={() => setSelectedEvent(event._id)}
								className={`w-56 md:w-full shrink-0 text-left p-3 rounded-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 relative ${
									selectedEvent === event._id
										? "bg-zinc-700/70 shadow-inner"
										: "hover:bg-zinc-800/50 bg-transparent"
								}`}
							>
								<p className="text-zinc-100 font-mono text-xs">
									{format(eventDateFromMs(event.eventDate), "PP")}
								</p>
								<p className="text-zinc-400 font-mono italic text-xs">
									{formatTime12h(event.startTime)}
								</p>
								<p className="text-zinc-300 font-medium text-[13px] overflow-hidden line-clamp-1">
									{event.title}
								</p>
								<div className="flex gap-2 items-center absolute top-2 right-2">
									<span
										className={`w-2.5 h-2.5 rounded-full ${event.status === "draft" ? "bg-yellow-500" : "bg-yellow-500/15"}`}
									/>
									<span
										className={`w-2.5 h-2.5 rounded-full ${event.status === "live" ? "bg-green-500" : "bg-green-500/15"}`}
									/>
									<span
										className={`w-2.5 h-2.5 rounded-full ${event.status === "archived" ? "bg-red-500" : "bg-red-500/15"}`}
									/>
								</div>
							</button>
						))}
					</div>
				</section>
				<section className="flex-1 bg-zinc-800/20 border border-zinc-800/50 rounded-xl overflow-hidden">
					{selectedEvent ? (
						<Suspense
							fallback={
								<div className="w-full h-full flex items-center justify-center">
									<Spinner className="size-8 text-zinc-700" />
								</div>
							}
						>
							<EventDetailsView
								eventId={selectedEvent}
								setSelectedEvent={setSelectedEvent}
							/>
						</Suspense>
					) : (
						<div className="w-full h-full flex items-center justify-center text-xs">
							<div className="flex flex-col gap-2">
								<p className="text-zinc-400 text-sm ">Events</p>
								<p className="text-zinc-500 whitespace-pre-line font-light mb-1">
									{`Start a new draft event,\nyou can add sections, jobs later.\nWhen you are ready, you can go live.`}
								</p>
								<Button
									variant={"ghost"}
									onClick={() => navigate({ to: "/app/events/create" })}
								>
									Create Event
								</Button>
							</div>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
