import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense, useEffect } from "react";
import { WatchlistEntryCard } from "#/components/authenticated/events/WatchlistEntryCard";
import { WatchlistEntryDialog } from "#/components/authenticated/events/WatchlistEntryDialog";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export const Route = createFileRoute(
	"/_authenticated/app/events/$eventId/watchlist",
)({
	component: WatchlistRouteWrapper,
});

function WatchlistRouteWrapper() {
	return (
		<Suspense
			fallback={
				<div className="w-full h-screen flex items-center justify-center bg-zinc-950">
					<Spinner className="size-8 text-zinc-700" />
				</div>
			}
		>
			<WatchlistRouteComponent />
		</Suspense>
	);
}

function WatchlistRouteComponent() {
	const params = Route.useParams();
	const eventId = params.eventId as Id<"events">;

	const { data: eventDetails } = useSuspenseQuery(
		convexQuery(api.events.getDetails, { eventId }),
	);
	const { data: entries } = useSuspenseQuery(
		convexQuery(api.watchlist.listForEvent, { eventId }),
	);

	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);

	useEffect(() => {
		if (!eventDetails?.event) return;
		setPageHeader({
			title: `Security: ${eventDetails.event.title}`,
			showBackButton: true,
		});
		return () => resetHeader();
	}, [
		setPageHeader,
		resetHeader,
		eventDetails?.event?.title,
		eventDetails?.event,
	]);

	if (!eventDetails) return <div>Event not found</div>;

	const isReadOnly = eventDetails.event.status === "archived";

	return (
		<div className="spine flex w-full flex-1 flex-col gap-4 py-4 bg-zinc-950 min-h-[calc(100dvh-4.5rem)]">
			<div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
				<div>
					<h1 className="text-xl font-bold text-zinc-50">Security watchlist</h1>
					<p className="text-zinc-400 text-sm mt-1 max-w-xl">
						Banned persons and prohibited items for this event.
						<br /> Dessiminate and inform staffs on the live floor.
					</p>
				</div>
				{!isReadOnly && (
					<WatchlistEntryDialog eventId={eventId}>
						<Button size="lg">
							<Plus className="size-4" />
							Create entry
						</Button>
					</WatchlistEntryDialog>
				)}
			</div>

			<div className="flex flex-1 flex-col gap-3 min-h-48">
				{entries.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
						{isReadOnly ? (
							<p className="text-zinc-400 text-sm">
								This event is archived. Watchlist is read-only.
							</p>
						) : (
							<>
								<p className="text-zinc-400 text-sm">
									No watchlist entries yet.
								</p>
								<WatchlistEntryDialog eventId={eventId}>
									<Button variant="link" className="mt-2">
										Create your first entry
									</Button>
								</WatchlistEntryDialog>
							</>
						)}
					</div>
				) : (
					entries.map((entry) => (
						<WatchlistEntryCard
							key={entry._id}
							entry={entry}
							readOnly={isReadOnly}
						/>
					))
				)}
			</div>
		</div>
	);
}
