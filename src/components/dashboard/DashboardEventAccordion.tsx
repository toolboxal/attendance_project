import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Suspense, useState } from "react";
import { LiveCountdown } from "#/components/authenticated/events/EventDetailsView";
import { LiveFloorOverview } from "#/components/dashboard/LiveFloorOverview";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { useEnterLiveFloor } from "#/hooks/use-enter-live-floor";
import { cn, eventDateFromMs, formatTime12h } from "#/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

const STATUS_STYLES: Record<
	Doc<"events">["status"],
	{ badge: string; label: string }
> = {
	live: { badge: "bg-green-500 text-zinc-950", label: "live" },
	draft: { badge: "bg-yellow-400 text-zinc-950", label: "draft" },
	archived: { badge: "bg-red-400 text-zinc-950", label: "archived" },
};

type DashboardEventAccordionProps = {
	events: Doc<"events">[];
	defaultOpenEventId?: string;
};

export function DashboardEventAccordion({
	events,
	defaultOpenEventId,
}: DashboardEventAccordionProps) {
	const [openEventId, setOpenEventId] = useState(defaultOpenEventId ?? "");

	if (events.length === 0) return null;

	return (
		<Accordion
			type="single"
			collapsible
			value={openEventId}
			onValueChange={setOpenEventId}
			className="rounded-xl border border-zinc-800/50 bg-zinc-800/20 overflow-hidden"
		>
			{events.map((event) => (
				<AccordionItem
					key={event._id}
					value={event._id}
					className="border-zinc-800/80 px-4"
				>
					<AccordionTrigger className="py-4 hover:no-underline">
						<EventAccordionHeader event={event} />
					</AccordionTrigger>
					<AccordionContent className="pb-4">
						{openEventId === event._id ? (
							<EventAccordionBody event={event} />
						) : null}
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
}

function EventAccordionHeader({ event }: { event: Doc<"events"> }) {
	const statusStyle = STATUS_STYLES[event.status];

	return (
		<div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left pr-2">
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={cn(
						"rounded-sm px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider",
						statusStyle.badge,
					)}
				>
					{statusStyle.label}
				</span>
				{event.status === "live" ? (
					<LiveCountdown expiresAt={event.expiresAt} />
				) : null}
			</div>
			<p className="text-base font-bold text-zinc-100">{event.title}</p>
			{event.description ? (
				<p className="text-xs text-zinc-400 line-clamp-2">
					{event.description}
				</p>
			) : null}
			<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
				<span className="font-mono">
					{format(eventDateFromMs(event.eventDate), "PPPP")}
				</span>
				<span className="font-mono italic">
					{formatTime12h(event.startTime)}
				</span>
				<span>{event.location}</span>
			</div>
		</div>
	);
}

function EventAccordionBody({ event }: { event: Doc<"events"> }) {
	const navigate = useNavigate();
	const { handleEnterLiveFloor, isEntering } = useEnterLiveFloor(event._id);
	const isLive = event.status === "live";

	return (
		<div className="flex flex-col gap-4 pt-2">
			{isLive ? (
				<div className="flex flex-row flex-wrap gap-2">
					<Button
						onClick={handleEnterLiveFloor}
						disabled={isEntering}
						variant="default"
						size="lg"
						className="animate-pulse"
					>
						{isEntering ? "Opening..." : "Enter Live Floor"}
					</Button>
					<Button
						onClick={() => navigate({ to: "/app/events" })}
						variant="ghost"
						size="lg"
					>
						Manage Event
					</Button>
				</div>
			) : null}

			<Suspense
				fallback={
					<div className="flex items-center justify-center py-12">
						<Spinner className="mb-2" />
						<p className="text-zinc-400 text-sm">Loading...</p>
					</div>
				}
			>
				<LiveFloorOverview eventId={event._id} showOpenCounts={isLive} />
			</Suspense>
		</div>
	);
}
