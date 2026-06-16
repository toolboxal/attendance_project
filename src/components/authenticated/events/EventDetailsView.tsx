import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { CircleAlert, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLiveCountdown } from "#/hooks/use-live-countdown";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	cn,
	eventDateFromMs,
	formatTime12h,
	isEventDateOnOrAfterToday,
} from "#/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { AssignRoleDialog } from "./AssignRoleDialog";
import { ManageStaffDialog } from "./ManageStaffDialog";

// High-performance isolated countdown timer to avoid parent details view re-renders
export function LiveCountdown({ expiresAt }: { expiresAt?: number }) {
	const timeLeft = useLiveCountdown(expiresAt ?? null);

	if (!expiresAt) return null;

	return (
		<div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-green-500">
			<Timer size={14} className="text-green-500" />
			<span>Expires in {timeLeft}</span>
		</div>
	);
}

export function EventDetailsView({
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
	const enterLiveFloor = useMutation(api.liveStaff.enterLiveFloorAsAdmin);
	const [isConfirmLiveOpen, setIsConfirmLiveOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isEnteringLiveFloor, setIsEnteringLiveFloor] = useState(false);

	const { data: details } = useSuspenseQuery(
		convexQuery(api.events.getDetails, { eventId: eventId as any }),
	);

	if (!details) return null;

	const { event, sections, slots, liveStaff } = details;
	const canGoLive = isEventDateOnOrAfterToday(event.eventDate);

	const handleEnterLiveFloor = async () => {
		try {
			setIsEnteringLiveFloor(true);
			const { accessToken } = await enterLiveFloor({
				eventId: eventId as Id<"events">,
			});
			localStorage.setItem("asistir_staff_token", accessToken);
			navigate({ to: "/live/jobs" });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to enter live floor",
			);
		} finally {
			setIsEnteringLiveFloor(false);
		}
	};

	const handleToggleStatus = async () => {
		const newStatus = event.status === "draft" ? "live" : "archived";
		try {
			await updateStatus({
				status: newStatus,
				eventId: eventId as Id<"events">,
			});
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to update event status";
			toast.error(message);
		}
	};

	const handleStatusButtonClick = () => {
		if (event.status === "draft") {
			setIsConfirmLiveOpen(true);
		} else {
			handleToggleStatus();
		}
	};

	const goToEditEvent = () => {
		navigate({
			to: "/app/events/$eventId/edit",
			params: { eventId: eventId as string },
		});
	};

	const goToWatchlist = () => {
		navigate({
			to: "/app/events/$eventId/watchlist",
			params: { eventId: eventId as string },
		});
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

	const needsDateUpdate = event.status === "draft" && !canGoLive;

	return (
		<div className="flex flex-col gap-8 px-2 py-4 md:p-6">
			{needsDateUpdate && (
				<div
					id="past-date-notice"
					className="flex flex-col gap-3 rounded-xl shadow shadow-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div className="flex gap-3">
						<CircleAlert
							strokeWidth={1.5}
							size={18}
							className="shrink-0 text-red-400"
							aria-hidden
						/>
						<div>
							<p className="text-sm font-semibold text-red-300">
								This event&apos;s date has already passed
							</p>
							<p className="mt-1 text-xs text-zinc-100">
								Update the date to today or later before you can go live.
								<strong className="font-medium text-zinc-400">
									{" "}
									Go Live stays unavailable until then.
								</strong>
							</p>
						</div>
					</div>
					<Button
						type="button"
						variant="link"
						size="sm"
						className="shrink-0  text-zinc-100 hover:bg-zinc-950/70"
						onClick={goToEditEvent}
					>
						Update date
					</Button>
				</div>
			)}

			{/* header */}
			<div className="flex flex-row flex-wrap gap-1.5 justify-end items-center">
				{event.status === "live" && (
					<Button
						onClick={handleEnterLiveFloor}
						disabled={isEnteringLiveFloor}
						variant="default"
						size="lg"
						className="animate-pulse"
					>
						{isEnteringLiveFloor ? "Opening..." : "Enter Live Event"}
					</Button>
				)}
				{event.status !== "archived" && (
					<Button
						onClick={handleStatusButtonClick}
						disabled={needsDateUpdate}
						variant={event.status === "draft" ? "default" : "destructive"}
						size={"lg"}
						aria-describedby={needsDateUpdate ? "past-date-notice" : undefined}
					>
						{event.status === "draft" ? "Go Live" : "End Event"}
					</Button>
				)}
				<Button onClick={goToWatchlist} variant={"ghost"} size={"lg"}>
					Security
				</Button>
				{event.status !== "archived" && (
					<Button onClick={goToEditEvent} variant={"ghost"} size={"lg"}>
						Edit Event
					</Button>
				)}
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
						className={`w-fit flex flex-row items-center justify-center p-2 rounded-lg text-xs font-mono border uppercase tracking-wider font-semibold ${event.status === "live" ? "bg-green-500 text-zinc-950" : event.status === "draft" ? "bg-yellow-400 text-zinc-950" : "bg-red-400 text-zinc-950"}`}
					>
						{event.status}
					</span>
					{event.status === "live" && (
						<LiveCountdown expiresAt={event.expiresAt} />
					)}
				</div>
				<h2 className="text-2xl font-bold text-zinc-100">{event.title}</h2>
				<div className="flex flex-col gap-1">
					<div className="flex flex-wrap items-center gap-2">
						<p
							suppressHydrationWarning
							className={cn(
								"font-mono text-xs",
								needsDateUpdate ? "text-red-400" : "text-zinc-100",
							)}
						>
							{format(eventDateFromMs(event.eventDate), "PPPP")}
						</p>
					</div>
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
									const assignedCount = sectionSlots.filter(
										(s) => s.assignedStaffId,
									).length;
									const totalSlots = sectionSlots.length;

									return (
										<div
											key={section._id}
											className="bg-zinc-950/20  rounded-xl p-1 md:p-4 space-y-4"
										>
											{/* Section Header */}
											<div className="flex flex-row justify-between items-center border-b border-zinc-800 pb-2">
												<div>
													<p className="text-zinc-100 font-bold capitalize text-base">
														{section.name}
													</p>
													<p className="text-yellow-100 font-mono text-xs mt-1">
														{formatTime12h(section.startTime ?? "")} -{" "}
														{formatTime12h(section.endTime ?? "")}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
														ROLES:
													</span>
													<span className="text-zinc-300 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
														{assignedCount}/{totalSlots}
													</span>
												</div>
											</div>

											{/* Roles grid inside this section */}
											{sectionSlots.length === 0 ? (
												<p className="text-zinc-600 text-[11px] italic">
													No role slots defined for this section.
												</p>
											) : (
												<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
													{sectionSlots.map((slot) => {
														const assignedStaff = liveStaff.find(
															(ls) => ls._id === slot.assignedStaffId,
														);

														return (
															<div
																key={slot._id}
																className="flex items-center gap-3 bg-zinc-900  p-2.5 rounded-lg hover:bg-zinc-800/70 transition-colors"
															>
																{/* <div
																	className={`w-1.5 h-8 rounded-full ${slot.role === "supervisor" ? "bg-indigo-500/50" : "bg-emerald-500/50"}`}
																/> */}
																<div>
																	<p className="text-zinc-200 font-medium text-sm">
																		{slot.title}
																	</p>
																	<p
																		className={` text-[10px] uppercase tracking-wider font-semibold ${slot.role === "supervisor" ? "text-emerald-500" : "text-yellow-400"}`}
																	>
																		{slot.role}
																	</p>
																</div>
																{!assignedStaff ? (
																	event.status !== "archived" ? (
																		<AssignRoleDialog
																			slot={slot}
																			section={section}
																		/>
																	) : (
																		<span className="ml-auto text-sm text-zinc-500">
																			Unassigned
																		</span>
																	)
																) : (
																	<ManageStaffDialog
																		slot={slot}
																		section={section}
																		staff={assignedStaff}
																		isArchived={event.status === "archived"}
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
