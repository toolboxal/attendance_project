import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, parse } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/app/events/")({
	component: RouteComponent,
});

// Bulletproof date-fns parser that handles 24h format cleanly
function formatTime12h(timeStr: string) {
	if (!timeStr) return "";
	try {
		// Strip seconds if they exist to normalize before parsing
		const cleanTime = timeStr.substring(0, 5);
		const parsedDate = parse(cleanTime, "HH:mm", new Date());
		return format(parsedDate, "h:mm a");
	} catch (e) {
		return timeStr;
	}
}

// Subcomponent that isolates the conditional suspense query securely
function EventDetailsView({ eventId }: { eventId: string }) {
	const { data: details } = useSuspenseQuery(
		convexQuery(api.events.getDetails, { eventId: eventId as any }),
	);
	if (!details) return null;

	return (
		<div className="flex flex-col gap-8 p-6">
			{/* header */}
			<div className="flex flex-row justify-between items-center">
				<span
					className={`flex flex-row items-center justify-center p-2 rounded-lg text-xs font-mono border ${details.event.status === "live" ? "bg-green-500/70 border-green-500/70" : details.event.status === "draft" ? "bg-yellow-500/70 border-yellow- border-green-500/70500/70" : "bg-red-500/70"}`}
				>
					{details.event.status}
				</span>
				<div className="flex flex-col">
					<p className="text-zinc-100 font-mono text-xs">
						{format(new Date(details.event.eventDate), "PPPP")}
					</p>
					<p className="text-zinc-400 font-mono italic text-xs self-end">
						{formatTime12h(details.event.startTime)}
					</p>
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<h2 className="text-2xl font-bold text-zinc-100">
					{details.event.title}
				</h2>
				<div className="flex flex-col">
					<p className="text-zinc-100 font-mono text-xs">
						{format(new Date(details.event.eventDate), "PPPP")}
					</p>
					<p className="text-zinc-400 font-mono italic text-xs">
						{formatTime12h(details.event.startTime)}
					</p>
				</div>
				<p className="text-zinc-100 font-bold">
					Location: {details.event.location}
				</p>
				<p className="text-zinc-300 text-sm italic">{details.event.description}</p>

				{/* Display Nested Info! */}
				<div className="mt-4 border-t border-zinc-800/50 pt-4 text-xs text-zinc-500">
					Configuration contains {details.sections.length} layout sections with{" "}
					{details.slots.length} staffing roles defined.
				</div>
			</div>
		</div>
	);
}

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
		<div className="w-full min-h-dvh ">
			<div className="spine flex flex-row bg-zinc-950 h-full py-2 gap-2">
				<section className="flex-1 bg-zinc-800/20 border border-zinc-800/50 rounded-xl">
					<div className="p-1 flex flex-col gap-1">
						{events.map((event) => (
							<button
								type="button"
								key={event._id}
								onClick={() => setSelectedEvent(event._id)}
								className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 relative ${
									selectedEvent === event._id
										? "bg-zinc-800/80 shadow-inner"
										: "hover:bg-zinc-800/50 bg-transparent"
								}`}
							>
								<p className="text-zinc-100 font-mono text-xs">
									{format(new Date(event.eventDate), "PP")}
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
				<section className="flex-3 bg-zinc-800/20 border border-zinc-800/50 rounded-xl overflow-hidden">
					{selectedEvent ? (
						<EventDetailsView eventId={selectedEvent} />
					) : (
						<div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
							Select an event from the sidebar to begin
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
