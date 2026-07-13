import { BellRing, Binoculars, ChevronDown } from "lucide-react";
import { tv } from "tailwind-variants";
import { PhoneMockupShell } from "#/components/public/landing/LiveFloorPreviewChrome";
import {
	capitalizeWords,
	cn,
	formatRelativeTime,
	formatStaffRoleLabel,
} from "#/lib/utils";
import { MAX_ACTIVE_ALERTS } from "../../../../convex/constants";

type PreviewAlert = {
	id: string;
	sectionName: string;
	creatorRoleTitle: string;
	creatorName: string;
	creatorRole: string;
	alertType: string;
	body: string;
	createdAt: number;
	isPinned: boolean;
	unreadCount?: number;
	latestUpdate?: {
		content: string;
		authorName: string;
		createdAt: number;
	};
};

const NOW = Date.now();

const MOCK_ALERTS: PreviewAlert[] = [
	{
		id: "preview_alert_1",
		sectionName: "gate a",
		creatorRoleTitle: "Gate Supervisor",
		creatorName: "James Wu",
		creatorRole: "supervisor",
		alertType: "crowd_control",
		body: "Queue backing up at Gate A — need two more ushers.",
		createdAt: NOW - 1000 * 60 * 8,
		isPinned: true,
		unreadCount: 2,
		latestUpdate: {
			content: "On my way from VIP lounge.",
			authorName: "David Park",
			createdAt: NOW - 1000 * 60 * 5,
		},
	},
	{
		id: "preview_alert_2",
		sectionName: "main hall",
		creatorRoleTitle: "Floor Coordinator",
		creatorName: "Toby Scott",
		creatorRole: "supervisor",
		alertType: "medical",
		body: "Guest feeling faint near row C — first aid requested.",
		createdAt: NOW - 1000 * 60 * 3,
		isPinned: false,
	},
	{
		id: "preview_alert_3",
		sectionName: "lobby",
		creatorRoleTitle: "Section Usher",
		creatorName: "Maria Santos",
		creatorRole: "staff",
		alertType: "lost_person",
		body: "Child separated from parents — last seen near coat check.",
		createdAt: NOW - 1000 * 60 * 14,
		isPinned: false,
		latestUpdate: {
			content: "Parents located. Closing shortly.",
			authorName: "Priya Nair",
			createdAt: NOW - 1000 * 60 * 2,
		},
	},
];

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 pb-2 min-h-0",
	},
});

function PreviewAlertCard({ alert }: { alert: PreviewAlert }) {
	return (
		<div
			className={cn(
				"bg-zinc-500/50 rounded-md overflow-hidden text-zinc-50",
				alert.isPinned && "ring-1 ring-red-500",
			)}
		>
			<div className="flex flex-row items-stretch border-b border-zinc-600">
				<div className="min-w-0 flex-1 text-left px-2 py-0.5">
					<div className="flex flex-col leading-tight">
						<div className="flex flex-row items-center gap-2">
							<span className="font-medium text-zinc-50 tracking-tight text-sm truncate">
								{capitalizeWords(alert.sectionName)}
							</span>
							{alert.isPinned && (
								<span className="text-[10px] font-bold text-amber-400 uppercase shrink-0">
									Pinned
								</span>
							)}
						</div>
						<span className="font-medium text-zinc-300 text-xs">
							{alert.creatorRoleTitle}
						</span>
						<div className="flex flex-row items-center gap-1">
							<span className="font-medium text-[11px] italic text-zinc-300">
								{alert.creatorName}
							</span>
							<span className="font-medium text-[11px] italic text-zinc-300">
								{formatStaffRoleLabel(alert.creatorRole)}
							</span>
						</div>
					</div>
				</div>

				<div className="flex shrink-0 flex-col gap-1 self-stretch px-2 py-0.5">
					{alert.unreadCount != null && alert.unreadCount > 0 && (
						<div className="flex flex-row items-start justify-end gap-1 pt-0.5 shrink-0">
							<span className="text-[9px] font-medium italic text-zinc-50 leading-tight text-right">
								new
								<br />
								messages
							</span>
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-zinc-50">
								{alert.unreadCount}
							</span>
						</div>
					)}
					<div className="mt-auto flex flex-row items-center justify-end gap-1.5 pb-0.5">
						<span className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950">
							Resolve
						</span>
					</div>
				</div>
			</div>

			<div className="w-full text-left pb-2 px-2">
				<div className="flex flex-row gap-2 items-start">
					<div className="flex flex-col leading-tight pt-1.5 min-w-0 flex-1">
						<span className="text-[11px] font-bold text-red-400 uppercase">
							{alert.alertType.replaceAll("_", " ")}
						</span>
						<p className="text-sm text-red-100 font-medium">{alert.body}</p>
						<p className="text-[11px] text-zinc-400 italic">
							{formatRelativeTime(alert.createdAt)}
						</p>
					</div>
					<ChevronDown className="mt-auto size-5 shrink-0 text-zinc-300" />
				</div>
				{alert.latestUpdate && (
					<div className="w-full text-left bg-zinc-800/50 rounded-md py-1 px-2 mt-1">
						<span className="text-[10px] text-zinc-300 italic block">
							latest reply:
						</span>
						<span className="text-zinc-100 text-xs block line-clamp-1">
							{alert.latestUpdate.content}
						</span>
						<div className="text-[11px] text-zinc-100 px-0.5 flex flex-row justify-between items-center gap-1">
							<span className="font-medium text-zinc-400 block">
								{alert.latestUpdate.authorName}
							</span>
							<span className="text-zinc-400 italic block">
								{formatRelativeTime(alert.latestUpdate.createdAt)}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export function AlertsPreview() {
	const { container } = layoutStyles();

	return (
		<section className="spine py-16 md:py-24 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-backwards">
			<div className="flex flex-col md:flex-row gap-10 md:gap-12 items-start px-2 md:px-10">
				<div className="flex-1 max-w-xl text-left mt-8">
					<h2 className="text-3xl md:text-4xl font-heading text-zinc-100 tracking-tight leading-tight">
						Keep every floor incident in one place
					</h2>
					<p className="text-lg text-zinc-400 pt-4 font-light leading-relaxed">
						Pinned alerts, threaded updates, and a clear queue — so medical,
						crowd, and lost-person issues reach the right people fast.
					</p>
				</div>
				<PhoneMockupShell heightClass="h-[480px]">
					<div className="flex w-3/4 h-9 items-center border-b border-zinc-800 shrink-0 pointer-events-none">
						<div className="flex flex-1 items-center justify-center gap-1.5 text-xs font-bold uppercase text-yellow-400">
							<BellRing className="size-3" />
							Incidents
							<span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-zinc-50">
								2
							</span>
						</div>
						<div className="flex flex-1 items-center justify-center gap-1.5 text-xs font-bold uppercase text-zinc-500">
							<Binoculars className="size-3" />
							Watchlist
						</div>
					</div>

					<div className="flex flex-row items-center justify-between py-2 border-b border-zinc-800 shrink-0 pointer-events-none">
						<span className="text-zinc-400 font-black text-sm uppercase">
							Active Alerts ({" "}
							<span
								className={cn(
									"font-bold",
									MOCK_ALERTS.length >= MAX_ACTIVE_ALERTS
										? "text-red-500"
										: "text-green-400",
								)}
							>
								{MOCK_ALERTS.length}
							</span>
							<span className="font-bold">/ {MAX_ACTIVE_ALERTS} Max)</span>
						</span>
					</div>

					<div className="relative flex-1 min-h-0 overflow-hidden">
						<div className={cn(container(), "pointer-events-none")}>
							{MOCK_ALERTS.map((alert) => (
								<PreviewAlertCard key={alert.id} alert={alert} />
							))}
						</div>
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10" />
					</div>
				</PhoneMockupShell>
			</div>
		</section>
	);
}
