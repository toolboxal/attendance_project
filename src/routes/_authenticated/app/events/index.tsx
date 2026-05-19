import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Suspense, useEffect, useState } from "react";
import { AssignRoleDialog } from "#/components/authenticated/events/AssignRoleDialog";
import { ManageStaffDialog } from "#/components/authenticated/events/ManageStaffDialog";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { formatTime12h } from "#/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { CircleAlert, Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/events/")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(convexQuery(api.events.list, {})),
	component: RouteComponent,
});

// High-performance isolated countdown timer to avoid parent details view re-renders
function LiveCountdown({ expiresAt }: { expiresAt?: number }) {
	const [timeLeft, setTimeLeft] = useState<string>("");

	useEffect(() => {
		if (!expiresAt) return;

		const updateTimer = () => {
			const diff = expiresAt - Date.now();
			if (diff <= 0) {
				setTimeLeft("Expired");
				return;
			}

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			const pad = (n: number) => String(n).padStart(2, "0");
			setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [expiresAt]);

	if (!expiresAt) return null;

	return (
		<div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold  text-green-500">
			<Timer size={14} className="text-green-500" />
			<span>Expires in {timeLeft}</span>
		</div>
	);
}

// Subcomponent that isolates the conditional suspense query securely
function EventDetailsView({
	eventId,
	setSelectedEvent,
}: {
	eventId: string;
	setSelectedEvent: (id: string | undefined) => void;
}) {
	const navigate = useNavigate();
	const updateStatus = useMutation(api.events.updateStatus);
	const duplicateEvent = useMutation(api.events.duplicate);
	const deleteEvent = useMutation(api.events.deleteEvent);
	const [isConfirmLiveOpen, setIsConfirmLiveOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const { data: details } = useSuspenseQuery(
		convexQuery(api.events.getDetails, { eventId: eventId as any }),
	);

	if (!details) return null;

	// console.log(details);
	const { event, sections, slots, liveStaff } = details;

	const handleToggleStatus = async () => {
		const newStatus = event.status === "draft" ? "live" : "archived";
		try {
			await updateStatus({
				status: newStatus,
				eventId: eventId as Id<"events">,
			});
		} catch (err) {
			console.error("Failed to update event status:", err);
		}
	};

	const handleStatusButtonClick = () => {
		if (event.status === "draft") {
			setIsConfirmLiveOpen(true);
		} else {
			handleToggleStatus();
		}
	};

	const handleDuplicate = async () => {
		try {
			const result = await duplicateEvent({
				eventId: eventId as Id<"events">,
			});
			setSelectedEvent(result.newEventId);
		} catch (err) {
			console.error("Failed to duplicate event:", err);
		}
	};

	const handleDelete = async () => {
		try {
			await deleteEvent({
				eventId: eventId as Id<"events">,
			});
			setSelectedEvent(undefined);
		} catch (err) {
			console.error("Failed to delete event:", err);
		}
	};

	return (
		<div className="flex flex-col gap-8 px-2 py-4 md:p-6">
			{/* header */}
			<div className="flex flex-row gap-1.5 justify-end items-center">
				{event.status !== "archived" && (
					<Button
						onClick={handleStatusButtonClick}
						variant={event.status === "draft" ? "default" : "destructive"}
						size={"lg"}
					>
						{event.status === "draft" ? "Go Live" : "End Event"}
					</Button>
				)}
				<Button
					onClick={() => {
						navigate({
							to: "/app/events/$eventId",
							params: { eventId: eventId as string },
						});
					}}
					variant={"secondary"}
					size={"lg"}
				>
					Edit Event
				</Button>
				{event.status !== "live" && (
					<>
						<Button onClick={handleDuplicate} variant={"ghost"} size={"lg"}>
							Duplicate
						</Button>
						<Button
							onClick={() => setIsDeleteOpen(true)}
							variant={"destructive"}
							size={"lg"}
						>
							Delete
						</Button>
					</>
				)}
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex flex-row items-center gap-1 mb-2">
					<span
						className={`w-fit flex flex-row items-center justify-center p-2 rounded-lg text-xs font-mono border uppercase tracking-wider font-semibold ${event.status === "live" ? "bg-green-500 text-zinc-950 animate-pulse" : event.status === "draft" ? "bg-yellow-400 text-zinc-950" : "bg-red-400 text-zinc-950"}`}
					>
						{event.status}
					</span>
					{event.status === "live" && (
						<LiveCountdown expiresAt={event.expiresAt} />
					)}
				</div>
				<h2 className="text-2xl font-bold text-zinc-100">{event.title}</h2>
				<div className="flex flex-col">
					<p
						suppressHydrationWarning
						className="text-zinc-100 font-mono text-xs"
					>
						{format(new Date(event.eventDate), "PPPP")}
					</p>
					<p
						suppressHydrationWarning
						className="text-zinc-400 font-mono italic text-xs"
					>
						{formatTime12h(event.startTime)}
					</p>
				</div>
				<p className="text-zinc-100 font-bold">Location: {event.location}</p>
				<p className="text-zinc-300 text-sm italic">{event.description}</p>

				<div className="mt-6 space-y-6">
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
											className="bg-zinc-950/20  rounded-xl p-1 md:p-4 space-y-4"
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
													{sectionSlots.map((slot) => {
														const assignedStaff = liveStaff?.find(
															(s) => s._id === slot.assignedStaffId,
														);

														return (
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
																{!assignedStaff ? (
																	<AssignRoleDialog
																		slot={slot}
																		section={section}
																	/>
																) : (
																	<ManageStaffDialog
																		slot={slot}
																		section={section}
																		staff={assignedStaff}
																	/>
																)}
															</div>
														);
													})}
												</div>
											)}
										</div>
									);
								})}
						</div>
					)}
				</div>
			</div>

			<Dialog open={isConfirmLiveOpen} onOpenChange={setIsConfirmLiveOpen}>
				<DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100">
					<DialogHeader>
						<DialogTitle className="text-zinc-50 font-bold text-xl flex items-center gap-2">
							Confirm Go Live
						</DialogTitle>
						<DialogDescription className="text-zinc-200 text-sm mt-2 space-y-2">
							<p className="font-semibold text-lg">{event.title}</p>
							<div className="px-3 py-4 rounded-xl bg-zinc-950 ">
								<p className="text-zinc-300 font-medium mb-2 text-sm underline underline-offset-4">
									Important Notes
								</p>
								<div className="flex flex-row items-center gap-2 mb-1">
									<CircleAlert
										strokeWidth={1.5}
										size={18}
										className="text-red-400"
									/>
									<p className="text-zinc-300 font-medium text-xs">
										Going live will consume 1 Event Pass Credit.
									</p>
								</div>
								<div className="flex flex-row items-center gap-2 mb-1">
									<CircleAlert
										strokeWidth={1.5}
										size={18}
										className="text-red-400"
									/>
									<p className="text-zinc-300 font-medium text-xs">
										Live event cannot be reverted back to a draft.
									</p>
								</div>
								<div className="flex flex-row items-center gap-2 mb-1">
									<CircleAlert
										strokeWidth={1.5}
										size={18}
										className="text-red-400"
									/>
									<p className="text-zinc-300 font-medium text-xs">
										24hrs window starts once event goes live.
									</p>
								</div>
							</div>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4 flex flex-col sm:flex-row gap-4 justify-end">
						<Button
							variant="ghost"
							onClick={() => setIsConfirmLiveOpen(false)}
							className="text-zinc-400 hover:text-zinc-200"
						>
							Cancel
						</Button>
						<Button
							onClick={async () => {
								setIsConfirmLiveOpen(false);
								await handleToggleStatus();
							}}
							variant="default"
							className="bg-green-400 hover:bg-green-300 text-zinc-950 font-bold"
						>
							Confirm Go Live
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100">
					<DialogHeader>
						<DialogTitle className="text-red-400 font-bold text-xl flex items-center gap-2">
							Delete Event
						</DialogTitle>
						<DialogDescription className="text-zinc-200 text-sm mt-2 space-y-3">
							<p className="font-semibold text-lg">{event.title}</p>
							<p className="text-zinc-400">
								Are you sure you want to permanently delete this event? This
								action will permanently erase all associated sections, jobs,
								shift slots, worker sign-ins, and active chat threads.
							</p>
							<p className="text-red-400 font-bold text-xs uppercase tracking-wide">
								Warning: This action is destructive and cannot be undone.
							</p>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4 flex flex-col sm:flex-row gap-4 justify-end">
						<Button
							variant="ghost"
							onClick={() => setIsDeleteOpen(false)}
							className="text-zinc-400 hover:text-zinc-200"
						>
							Cancel
						</Button>
						<Button
							onClick={async () => {
								setIsDeleteOpen(false);
								await handleDelete();
							}}
							variant="destructive"
							className="font-bold"
						>
							Confirm Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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
								<p
									suppressHydrationWarning
									className="text-zinc-100 font-mono text-xs"
								>
									{format(new Date(event.eventDate), "PP")}
								</p>
								<p
									suppressHydrationWarning
									className="text-zinc-400 font-mono italic text-xs"
								>
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
