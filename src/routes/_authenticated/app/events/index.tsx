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

	console.log(details);
	const { event, sections, slots } = details;

	return (
		<div className="flex flex-col gap-8 p-6">
			{/* header */}
			<div className="flex flex-row justify-between items-center">
				<span
					className={`flex flex-row items-center justify-center p-2 rounded-lg text-xs font-mono border ${event.status === "live" ? "bg-green-500/70 border-green-500/70" : event.status === "draft" ? "bg-yellow-500/70 border-yellow- border-green-500/70500/70" : "bg-red-500/70"}`}
				>
					{event.status}
				</span>
				<div className="flex flex-col">
					<p className="text-zinc-100 font-mono text-xs">
						{format(new Date(event.eventDate), "PPPP")}
					</p>
					<p className="text-zinc-400 font-mono italic text-xs self-end">
						{formatTime12h(event.startTime)}
					</p>
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<h2 className="text-2xl font-bold text-zinc-100">{event.title}</h2>
				<div className="flex flex-col">
					<p className="text-zinc-100 font-mono text-xs">
						{format(new Date(event.eventDate), "PPPP")}
					</p>
					<p className="text-zinc-400 font-mono italic text-xs">
						{formatTime12h(event.startTime)}
					</p>
				</div>
				<p className="text-zinc-100 font-bold">Location: {event.location}</p>
				<p className="text-zinc-300 text-sm italic">{event.description}</p>

				<div className="mt-8 space-y-6">
					<h3 className="text-zinc-500 font-semibold text-xs uppercase tracking-widest">
						Event Schedule & Sections
					</h3>

					{sections.length === 0 ? (
						<p className="text-zinc-600 text-sm italic">
							No sections created yet.
						</p>
					) : (
						<div className="grid gap-4">
							{[...sections]
								.sort((a, b) =>
									(a.startTime || "").localeCompare(b.startTime || ""),
								)
								.map((section) => {
									// 🎯 Find slots belonging to this specific section instance!
									const sectionSlots = slots.filter(
										(s) => s.sectionId === section._id,
									);

									return (
										<div
											key={section._id}
											className="bg-zinc-950/20  rounded-xl p-4 space-y-4"
										>
											{/* Section Header */}
											<div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
												<div>
													<p className="text-zinc-500 font-mono text-xs flex gap-2 my-0.5">
														<span className="text-yellow-100 font-medium">
															{formatTime12h(section.startTime || "")}
														</span>
														<span>→</span>
														<span className="text-yellow-100 font-medium">
															{formatTime12h(section.endTime || "")}
														</span>
													</p>
													<h4 className="text-zinc-100 font-bold text-md capitalize">
														{section.name}
													</h4>
												</div>
												<div className="bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-400 font-medium uppercase">
													{sectionSlots.length} Roles
												</div>
											</div>

											{/* Role Slots Grid */}
											{sectionSlots.length === 0 ? (
												<p className="text-zinc-700 text-xs italic">
													No roles assigned to this shift yet.
												</p>
											) : (
												<div className="grid grid-cols-1 gap-2">
													{sectionSlots.map((slot) => (
														<div
															key={slot._id}
															className="flex items-center gap-3 bg-zinc-900  p-2.5 rounded-lg hover:bg-zinc-800/70 transition-colors"
														>
															<div
																className={`w-1.5 h-8 rounded-full ${slot.role === "supervisor" ? "bg-indigo-500/50" : "bg-emerald-500/50"}`}
															/>
															<div>
																<p className="text-zinc-200 font-medium text-sm">
																	{slot.title}
																</p>
																<p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
																	{slot.role}
																</p>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									);
								})}
						</div>
					)}
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
						<div className="w-full h-full flex items-center justify-center text-xs">
							<div className="flex flex-col gap-2">
								<p className="text-zinc-400 text-sm ">Events</p>
								<p className="text-zinc-500 whitespace-pre-line font-light mb-1">
									{`Start a new draft event,\nyou can add sections, jobs later.\nWhen you are ready, you can go live.`}
								</p>
								<Button
									variant={"link"}
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
