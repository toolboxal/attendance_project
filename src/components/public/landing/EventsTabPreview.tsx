import { format } from "date-fns";
import {
	Bell,
	Calendar,
	ChevronDown,
	CreditCard,
	LayoutDashboard,
	Settings,
	Timer,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "#/components/ui/button";
import { formatTime12h } from "#/lib/utils";

const MOCK_EVENTS = [
	{
		id: "event-live",
		title: "Diane's Wedding Reception",
		eventDate: new Date(2026, 6, 12),
		startTime: "18:00",
		location: "Grand Ballroom, Hotel Madison",
		description:
			"Evening reception for 200 guests with dinner, dancing, and family seating.",
		status: "live" as const,
		selected: true,
	},
	{
		id: "event-draft-1",
		title: "Product Launch Workshop",
		eventDate: new Date(2026, 8, 3),
		startTime: "14:00",
		location: "Innovation Hub, Room 204",
		description: "Internal launch prep for the Q4 product release.",
		status: "draft" as const,
		selected: false,
	},
	{
		id: "event-draft-2",
		title: "Team Offsite 2026",
		eventDate: new Date(2026, 11, 8),
		startTime: "08:30",
		location: "Lakeside Retreat Center",
		description: "Annual planning offsite for department leads.",
		status: "draft" as const,
		selected: false,
	},
	{
		id: "event-archived",
		title: "Annual Summit 2026",
		eventDate: new Date(2026, 3, 15),
		startTime: "09:00",
		location: "Convention Center, Hall A",
		description:
			"Regional leadership conference with 800+ attendees across three halls.",
		status: "archived" as const,
		selected: false,
	},
];

const MOCK_EVENT =
	MOCK_EVENTS.find((event) => event.selected) ?? MOCK_EVENTS[0];

const MOCK_SECTIONS = [
	{
		name: "main hall",
		startTime: "09:00",
		endTime: "12:00",
		slots: [
			{
				title: "Floor Coordinator",
				role: "supervisor",
				staff: "Jon Doe",
				activated: true,
			},
			{
				title: "Usher Lead",
				role: "staff",
				staff: "Maria Santos",
				activated: true,
			},
			{
				title: "Door Attendant",
				role: "staff",
				staff: "Priya Nair",
				activated: false,
			},
		],
	},
	{
		name: "vip lounge",
		startTime: "10:00",
		endTime: "14:00",
		slots: [
			{
				title: "VIP Host",
				role: "supervisor",
				staff: "James Wu",
				activated: true,
			},
			{
				title: "Guest Liaison",
				role: "usher",
				staff: "David Park",
				activated: false,
			},
		],
	},
];

const NAV_ITEMS = [
	{ title: "Dashboard", icon: LayoutDashboard, active: false },
	{ title: "Events", icon: Calendar, active: true },
	{ title: "Subscriptions", icon: CreditCard, active: false },
	{ title: "Settings", icon: Settings, active: false },
];

export function EventsTabPreview() {
	return (
		<motion.div
			className="spine relative mt-12 md:mt-16"
			initial={{ opacity: 0, y: 28 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1] }}
		>
			<div className="relative rounded-xl w-full overflow-hidden border-y border-white/5 bg-zinc-950 max-md:h-[600px] md:h-[650px]">
				<div className="flex w-full h-full pointer-events-none select-none">
					<PreviewSidebar />
					<div className="flex flex-1 flex-col min-w-0 min-h-0 bg-zinc-950">
						<PreviewTopHeader />
						<PreviewEventsTab />
					</div>
				</div>
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10" />
			</div>
		</motion.div>
	);
}

function PreviewSidebar() {
	return (
		<aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 h-full">
			<div className="p-4 border-b border-zinc-800">
				<p className="logo text-xl">Asistir</p>
			</div>
			<div className="p-2">
				<p className="px-2 py-1.5 text-xs font-medium text-zinc-500">
					Application
				</p>
				<ul className="space-y-1">
					{NAV_ITEMS.map((item) => (
						<li key={item.title}>
							<div
								className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
									item.active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"
								}`}
							>
								<item.icon className="size-4 shrink-0" />
								<span>{item.title}</span>
							</div>
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}

function PreviewTopHeader() {
	return (
		<div className="flex shrink-0 w-full border-b border-neutral-800 bg-zinc-950/80 backdrop-blur-md">
			<div className="flex w-full items-center justify-between px-4 py-4">
				<div className="w-10 shrink-0" />
				<p className="flex-1 truncate px-4 text-center text-xl font-bold text-white">
					Events
				</p>
				<div className="flex w-10 shrink-0 justify-end">
					<Bell className="size-5 text-zinc-400" />
				</div>
			</div>
		</div>
	);
}

function PreviewEventsTab() {
	const assignedCount = (section: (typeof MOCK_SECTIONS)[number]) =>
		section.slots.filter((slot) => slot.staff).length;

	return (
		<div className="flex flex-1 min-h-0 flex-col gap-2 overflow-hidden p-2 md:flex-row">
			<section className="flex-none rounded-xl border border-zinc-800/50 bg-zinc-800/20 md:w-60">
				<div className="flex flex-row gap-2 overflow-x-auto p-2 [scrollbar-width:none] md:flex-col md:overflow-x-visible md:overflow-y-auto [&::-webkit-scrollbar]:hidden">
					{MOCK_EVENTS.map((event) => (
						<button
							key={event.id}
							type="button"
							tabIndex={-1}
							className={`relative w-56 shrink-0 rounded-lg p-3 text-left md:w-full ${
								event.selected
									? "bg-zinc-700/70 shadow-inner"
									: "bg-transparent"
							}`}
						>
							<p className="text-zinc-100 font-mono text-xs">
								{format(event.eventDate, "PP")}
							</p>
							<p className="text-zinc-400 font-mono italic text-xs">
								{formatTime12h(event.startTime)}
							</p>
							<p className="text-zinc-300 font-medium text-[13px] overflow-hidden line-clamp-1">
								{event.title}
							</p>
							<EventStatusDots status={event.status} />
						</button>
					))}
				</div>
			</section>

			<section className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-800/20">
				<div className="flex flex-col gap-6 px-2 py-4 md:p-6 h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					<div className="flex flex-row flex-wrap gap-1 justify-end items-center shrink-0">
						<Button variant="default" size="lg">
							Enter Live Floor
						</Button>
						<Button variant="destructive" size="lg">
							End Event
						</Button>
						<Button variant="ghost" size="lg">
							Security
						</Button>
						<Button variant="ghost" size="lg">
							Edit Event
						</Button>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex flex-row items-center gap-1 mb-2">
							<span className="w-fit flex flex-row items-center justify-center p-2 rounded-lg text-xs font-mono border uppercase tracking-wider font-semibold bg-green-500 text-zinc-950">
								{MOCK_EVENT.status}
							</span>
							<div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-green-500">
								<Timer size={14} className="text-green-500" />
								<span>Expires in 18:42:15</span>
							</div>
						</div>
						<h2 className="text-2xl font-bold text-zinc-100">
							{MOCK_EVENT.title}
						</h2>
						<div className="flex flex-col gap-1">
							<p className="font-mono text-xs text-zinc-100">
								{format(MOCK_EVENT.eventDate, "PPPP")}
							</p>
							<p className="text-zinc-400 font-mono italic text-xs">
								{formatTime12h(MOCK_EVENT.startTime)}
							</p>
						</div>
						<p className="text-zinc-100 font-bold">
							Location: {MOCK_EVENT.location}
						</p>
						<p className="text-zinc-300 text-sm italic">
							{MOCK_EVENT.description}
						</p>

						<div className="mt-4 space-y-4">
							<h3 className="text-zinc-500 font-semibold text-xs uppercase tracking-widest">
								Event Schedule & Sections
							</h3>
							<div className="grid gap-4">
								{MOCK_SECTIONS.map((section) => (
									<div
										key={section.name}
										className="bg-zinc-950/20 rounded-xl p-1 md:p-4 space-y-4"
									>
										<div className="flex flex-row justify-between items-center border-b border-zinc-800 pb-2">
											<div>
												<p className="text-zinc-100 font-bold capitalize text-base">
													{section.name}
												</p>
												<p className="text-yellow-100 font-mono text-xs mt-1">
													{formatTime12h(section.startTime)} -{" "}
													{formatTime12h(section.endTime)}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
													ROLES:
												</span>
												<span className="text-zinc-300 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
													{assignedCount(section)}/{section.slots.length}
												</span>
											</div>
										</div>

										<div className="flex flex-col divide-y divide-zinc-800 rounded-sm overflow-hidden mt-2">
											{section.slots.map((slot) => (
												<div
													key={slot.title}
													className="flex items-center gap-3 bg-zinc-900 px-3 py-2.5"
												>
													<div>
														<p className="text-zinc-200 font-medium text-sm">
															{slot.title}
														</p>
														<p
															className={`text-[9px] uppercase tracking-wider font-semibold ${
																slot.role === "supervisor"
																	? "text-emerald-500"
																	: "text-zinc-400"
															}`}
														>
															{slot.role}
														</p>
													</div>
													{slot.staff ? (
														<div className="flex flex-col items-end ml-auto gap-0.5">
															<div className="flex items-center gap-0.5">
																<ChevronDown className="size-3 text-zinc-400" />
																<span className="text-zinc-300 font-medium text-xs">
																	{slot.staff}
																</span>
															</div>
															<span
																className={`text-[9px] font-semibold uppercase tracking-wider ${
																	slot.activated
																		? "text-emerald-400/80"
																		: "text-zinc-400"
																}`}
															>
																{slot.activated ? "activated" : "unactivated"}
															</span>
														</div>
													) : (
														<Button
															variant="link"
															size="sm"
															className="ml-auto text-sm font-normal text-zinc-400 px-2 h-auto"
															tabIndex={-1}
														>
															Assign
														</Button>
													)}
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

function EventStatusDots({
	status,
}: {
	status: "draft" | "live" | "archived";
}) {
	return (
		<div className="flex gap-2 items-center absolute top-2 right-2">
			<span
				className={`w-2.5 h-2.5 rounded-full ${status === "draft" ? "bg-yellow-500" : "bg-yellow-500/15"}`}
			/>
			<span
				className={`w-2.5 h-2.5 rounded-full ${status === "live" ? "bg-green-500" : "bg-green-500/15"}`}
			/>
			<span
				className={`w-2.5 h-2.5 rounded-full ${status === "archived" ? "bg-red-500" : "bg-red-500/15"}`}
			/>
		</div>
	);
}
