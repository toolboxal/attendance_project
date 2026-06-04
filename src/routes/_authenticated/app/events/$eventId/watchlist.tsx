import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";
import { Spinner } from "#/components/ui/spinner";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button } from "#/components/ui/button";
import { PlusIcon } from "lucide-react";

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

	const { data } = useSuspenseQuery(
		convexQuery(api.events.getDetails, { eventId }),
	);

	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);

	useEffect(() => {
		if (!data?.event) return;
		setPageHeader({
			title: `Security: ${data.event.title}`,
			showBackButton: true,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader, data?.event?.title, data?.event]);

	if (!data) return <div>Event not found</div>;

	const isReadOnly = data.event.status === "archived";

	return (
		<div className="spine flex w-full flex-1 flex-col gap-4 py-4 bg-zinc-950 min-h-[calc(100dvh-4.5rem)]">
			<div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
				<div>
					<h1 className="text-xl font-bold text-zinc-50">Security watchlist</h1>

					<p className="text-zinc-400 text-sm">
						This is to inform helpers of any banned persons or prohibited items
						for this event.
					</p>
				</div>
			</div>

			<div className="flex flex-1 flex-col items-center  justify-center rounded-xl  bg-zinc-950 border border-zinc-800/50 p-8 text-left min-h-48">
				{isReadOnly ? (
					<p className="text-zinc-400 text-xs">
						"This event is archived. Watchlist management is read-only."
					</p>
				) : (
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-zinc-400 text-xs">
							Create a new entry to add a person or item to the watchlist.
						</p>
						<Button variant={"link"} size={"lg"}>
							Create Entry
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
