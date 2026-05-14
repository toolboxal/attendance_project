import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { format, parse } from "date-fns";
import { Check, Copy, Share2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Spinner } from "#/components/ui/spinner";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/app/events/")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(convexQuery(api.events.list, {})),
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

function AssignRoleDialog({
	slot,
	section,
}: {
	slot: Doc<"roleSlots">;
	section: Doc<"eventSections">;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);
	const [inviteUrl, setInviteUrl] = useState("");

	const createInvite = useMutation(api.liveStaff.createStaffInvitation);

	const handleAssign = async () => {
		if (!name.trim()) {
			toast.error("Please enter a name first!");
			return;
		}

		try {
			setLoading(true);
			const result = await createInvite({
				slotId: slot._id,
				staffName: name.trim(),
			});

			// Generate absolute URL pointing to our public dynamic live route!
			const joinLink = `${window.location.origin}/live/${result.inviteToken}`;
			setInviteUrl(joinLink);

			toast.success("Staff assigned successfully!");
		} catch (err: any) {
			toast.error(err.message || "Failed to generate invite.");
		} finally {
			setLoading(false);
		}
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(inviteUrl);
		setCopied(true);
		toast.success("Invite Link Copied to Clipboard!");
		setTimeout(() => setCopied(false), 2000);
	};

	// Construct universal share payload for Native Share Sheet
	const shareTextBody = `Hi ${name}! Here is your secure access link for your assignment as ${slot.title}:`;
	const shareTextFull = `${shareTextBody}\n\n${inviteUrl}`;

	const handleNativeShare = async () => {
		try {
			if (navigator.share) {
				await navigator.share({
					title: `Access Link for ${name}`,
					text: shareTextBody,
					url: inviteUrl,
				});
			}
		} catch (err) {
			console.log("Share dismissed or failed:", err);
		}
	};

	// Check if device actually supports sharing so we don't show broken buttons on PC/Insecure contexts
	const canShare = typeof navigator !== "undefined" && !!navigator.share;

	// Construct graceful WhatsApp fallback for insecure testing & legacy support
	const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(shareTextFull)}`;

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) {
					setInviteUrl("");
					setName("");
				} // Reset on close
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant={"link"}
					size={"sm"}
					className="ml-auto text-sm font-normal text-zinc-400 hover:text-zinc-200 px-2 h-auto"
				>
					{slot.assignedStaffId ? "Edit Name" : "Assign"}
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">
						Assign {slot.title}
					</DialogTitle>
					<DialogDescription className="text-zinc-400">
						<div>
							<span className="text-yellow-100 font-mono text-xs">
								{formatTime12h(section.startTime || "")}
							</span>
							<span>→</span>
							<span className="text-yellow-100 font-mono text-xs">
								{formatTime12h(section.endTime || "")}
							</span>
						</div>
						<p className="text-zinc-100 text-sm uppercase mt-1">
							{section.name}
						</p>
					</DialogDescription>
				</DialogHeader>

				{!inviteUrl ? (
					<div className="grid gap-4 pb-4">
						<div className="grid items-center gap-2">
							<Label
								htmlFor="name"
								className="text-xs font-semibold text-zinc-500"
							>
								{slot.role === "supervisor" ? "Supervisor" : "Staff"} Name
							</Label>
							<Input
								id="name"
								placeholder="e.g. Cornelius Smith"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11"
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button
								onClick={handleAssign}
								disabled={loading}
								className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950"
							>
								{loading ? "Generating..." : "Generate Secure Invite Link"}
							</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="grid gap-4 py-4">
						<div className="">
							<p className="text-green-400 font-bold text-xs">
								Secure Link Generated
							</p>
							<p className="text-zinc-300 text-xs">
								Send this URL to {name} now.
							</p>
						</div>

						<div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-2 rounded-lg group">
							<p className="text-xs font-mono text-zinc-400 truncate flex-1 px-2">
								{inviteUrl}
							</p>
							<Button
								size="sm"
								onClick={handleCopy}
								className="shrink-0 bg-zinc-800 hover:bg-zinc-700 h-9"
							>
								{copied ? (
									<Check className="size-3.5" />
								) : (
									<Copy className="size-3.5" />
								)}
							</Button>
						</div>

						{/* 📱 UNIVERSAL NATIVE SHARE TRIGGER */}
						{canShare ? (
							<Button
								onClick={handleNativeShare}
								className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-6 rounded-xl text-sm w-full"
							>
								<Share2 className="size-4" />
								Share to App
							</Button>
						) : (
							/* 🟢 INTELLIGENT WHATSAPP FALLBACK (Triggers on Insecure Local Testing) */
							<a
								href={whatsAppUrl}
								target="_blank"
								rel="noreferrer"
								className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c35e] transition-colors text-white font-bold py-3.5 rounded-xl text-sm w-full"
							>
								<svg fill="none" viewBox="0 0 360 362" className="size-6">
									<title id="iconTitle">WhatsApp</title>
									<path
										fill="#ffffff"
										fillRule="evenodd"
										d="M307.546 52.566C273.709 18.684 228.706.017 180.756 0 81.951 0 1.538 80.404 1.504 179.235c-.017 31.594 8.242 62.432 23.928 89.609L0 361.736l95.024-24.925c26.179 14.285 55.659 21.805 85.655 21.814h.077c98.788 0 179.21-80.413 179.244-179.244.017-47.898-18.608-92.926-52.454-126.807v-.008Zm-126.79 275.788h-.06c-26.73-.008-52.952-7.194-75.831-20.765l-5.44-3.231-56.391 14.791 15.05-54.981-3.542-5.638c-14.912-23.721-22.793-51.139-22.776-79.286.035-82.14 66.867-148.973 149.051-148.973 39.793.017 77.198 15.53 105.328 43.695 28.131 28.157 43.61 65.596 43.593 105.398-.035 82.149-66.867 148.982-148.982 148.982v.008Zm81.719-111.577c-4.478-2.243-26.497-13.073-30.606-14.568-4.108-1.496-7.09-2.243-10.073 2.243-2.982 4.487-11.568 14.577-14.181 17.559-2.613 2.991-5.226 3.361-9.704 1.117-4.477-2.243-18.908-6.97-36.02-22.226-13.313-11.878-22.304-26.54-24.916-31.027-2.613-4.486-.275-6.91 1.959-9.136 2.011-2.011 4.478-5.234 6.721-7.847 2.244-2.613 2.983-4.486 4.478-7.469 1.496-2.991.748-5.603-.369-7.847-1.118-2.243-10.073-24.289-13.812-33.253-3.636-8.732-7.331-7.546-10.073-7.692-2.613-.13-5.595-.155-8.586-.155-2.991 0-7.839 1.118-11.947 5.604-4.108 4.486-15.677 15.324-15.677 37.361s16.047 43.344 18.29 46.335c2.243 2.991 31.585 48.225 76.51 67.632 10.684 4.615 19.029 7.374 25.535 9.437 10.727 3.412 20.49 2.931 28.208 1.779 8.604-1.289 26.498-10.838 30.228-21.298 3.73-10.46 3.73-19.433 2.613-21.298-1.117-1.865-4.108-2.991-8.586-5.234l.008-.017Z"
										clipRule="evenodd"
									/>
								</svg>
								Share via WhatsApp
							</a>
						)}

						<DialogClose asChild>
							<Button
								variant="ghost"
								className="w-full text-zinc-500"
								size={"lg"}
							>
								Done
							</Button>
						</DialogClose>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

// Subcomponent that isolates the conditional suspense query securely
function EventDetailsView({ eventId }: { eventId: string }) {
	const navigate = useNavigate();
	const { data: details } = useSuspenseQuery(
		convexQuery(api.events.getDetails, { eventId: eventId as any }),
	);
	if (!details) return null;

	// console.log(details);
	const { event, sections, slots } = details;

	return (
		<div className="flex flex-col gap-8 px-2 py-4 md:p-6">
			{/* header */}
			<div className="flex flex-row justify-between items-center">
				<span
					className={`flex flex-row items-center justify-center p-2 rounded-lg text-xs font-mono border ${event.status === "live" ? "bg-green-500/70 border-green-500/70" : event.status === "draft" ? "bg-yellow-500/70 border-yellow- border-green-500/70500/70" : "bg-red-500/70"}`}
				>
					{event.status}
				</span>

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
			</div>
			<div className="flex flex-col gap-2">
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
															<AssignRoleDialog slot={slot} section={section} />
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
							<EventDetailsView eventId={selectedEvent} />
						</Suspense>
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
