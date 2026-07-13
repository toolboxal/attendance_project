import { BellRing, Binoculars, ChevronDown, ChevronUp, Send } from "lucide-react";
import { tv } from "tailwind-variants";
import { PhoneMockupShell } from "#/components/public/landing/LiveFloorPreviewChrome";
import { cn, formatRelativeTime } from "#/lib/utils";

type PreviewWatchlistKind = "banned_person" | "prohibited_item";

type PreviewWatchlistUpdate = {
	id: string;
	authorName: string;
	content: string;
	createdAt: number;
	isOwn?: boolean;
};

type PreviewWatchlistEntry = {
	id: string;
	kind: PreviewWatchlistKind;
	label: string;
	notes?: string;
	photoUrl?: string;
	expanded?: boolean;
	updates: PreviewWatchlistUpdate[];
};

const KIND_LABELS: Record<PreviewWatchlistKind, string> = {
	banned_person: "Banned person",
	prohibited_item: "Prohibited item",
};

const NOW = Date.now();

const MOCK_WATCHLIST: PreviewWatchlistEntry[] = [
	{
		id: "preview_watchlist_1",
		kind: "banned_person",
		label: "Jon Doe",
		notes: "Do not admit. Last seen wearing a dark jacket near Gate A.",
		photoUrl: "/demo/banned-person.png",
		updates: [
			{
				id: "preview_wl_update_1",
				authorName: "James Wu",
				content: "Spotted near the queue — security notified.",
				createdAt: NOW - 1000 * 60 * 12,
			},
		],
	},
	{
		id: "preview_watchlist_2",
		kind: "prohibited_item",
		label: "Alcoholic drinks",
		notes: "No alcohol is permitted on the premises of this venue.",
		photoUrl: "/demo/prohibited-beer.png",
		expanded: true,
		updates: [
			{
				id: "preview_wl_update_2",
				authorName: "Maria Santos",
				content: "👍",
				createdAt: NOW - 1000 * 60 * 9,
			},
			{
				id: "preview_wl_update_3",
				authorName: "Priya Nair",
				content: "Acknowledged",
				createdAt: NOW - 1000 * 60 * 6,
			},
		],
	},
];

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 pb-2 min-h-0",
	},
});

function PreviewWatchlistCard({ entry }: { entry: PreviewWatchlistEntry }) {
	const kindColor =
		entry.kind === "banned_person" ? "text-red-300" : "text-amber-300";
	const latestUpdate = entry.updates[entry.updates.length - 1];
	const expanded = entry.expanded === true;

	return (
		<div className="bg-zinc-500/50 rounded-md overflow-hidden text-zinc-50">
			<div className="flex flex-row p-2 pb-0 gap-3 h-full">
				{entry.photoUrl && (
					<span className="block w-20 h-20 shrink-0 rounded-md overflow-hidden border border-zinc-500">
						<img
							src={entry.photoUrl}
							alt={entry.label}
							className="w-full h-full object-cover"
						/>
					</span>
				)}
				<div className="flex flex-col leading-tight min-w-0 flex-1">
					<span className={cn("text-[10px] font-bold uppercase", kindColor)}>
						{KIND_LABELS[entry.kind]}
					</span>
					<span className="font-semibold text-zinc-50 tracking-tight text-sm truncate">
						{entry.label}
					</span>
					{entry.notes && (
						<span className="text-zinc-300 text-xs mt-0.5">{entry.notes}</span>
					)}
				</div>
				<div className="flex flex-col items-stretch">
					<div className="flex flex-row items-center justify-end mt-auto">
						{expanded ? (
							<ChevronUp className="size-5 shrink-0 text-zinc-300" />
						) : (
							<ChevronDown className="size-5 shrink-0 text-zinc-300" />
						)}
					</div>
				</div>
			</div>
			<div className="px-2 py-1.5 space-y-2">
				{!expanded && latestUpdate && (
					<div className="w-full text-left bg-zinc-800/50 rounded-md py-1 px-2">
						<span className="text-[10px] text-zinc-300 italic block">
							latest update:
						</span>
						<span className="text-zinc-100 text-xs block line-clamp-1">
							{latestUpdate.content}
						</span>
						<div className="text-[11px] text-zinc-100 px-0.5 flex flex-row justify-between items-center gap-1">
							<span className="font-medium text-zinc-400 block">
								{latestUpdate.authorName}
							</span>
							<span className="text-zinc-400 italic block">
								{formatRelativeTime(latestUpdate.createdAt)}
							</span>
						</div>
					</div>
				)}
			</div>

			{expanded && (
				<div className="border-t border-zinc-600 bg-zinc-800 px-2 py-2 flex flex-col gap-2">
					<div className="flex max-h-48 flex-col gap-1 overflow-y-auto py-1">
						{entry.updates.map((update) => {
							const isOwn = update.isOwn === true;
							return (
								<div
									key={update.id}
									className={cn(
										"flex w-fit flex-col",
										isOwn ? "items-end self-end" : "items-start self-start",
									)}
								>
									<div
										className={cn(
											"rounded-lg px-2.5 py-1.5 text-xs shadow-sm",
											isOwn
												? "bg-emerald-800 text-zinc-50 shadow-emerald-500/50"
												: "bg-zinc-600 text-zinc-50 shadow-zinc-300/50",
										)}
									>
										<p className="leading-tight">{update.content}</p>
										<div className="flex flex-row items-center justify-between gap-2">
											<span
												className={cn(
													"text-[10px] font-medium",
													isOwn ? "text-emerald-400" : "text-zinc-300",
												)}
											>
												{update.authorName}
											</span>
											<span
												className={cn(
													"text-right text-[10px]",
													isOwn ? "text-emerald-200/80" : "text-zinc-300",
												)}
											>
												{formatRelativeTime(update.createdAt)}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<div className="flex items-start gap-1.5 pt-1">
						<div className="min-h-8 min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-500">
							Add update...
						</div>
						<span className="shrink-0 rounded-lg bg-zinc-200 p-1.5 text-zinc-950">
							<Send className="size-3.5" />
						</span>
					</div>
				</div>
			)}
		</div>
	);
}

export function WatchlistPreview() {
	const { container } = layoutStyles();

	return (
		<section className="spine py-16 md:py-24 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-backwards">
			<div className="flex flex-col md:flex-row gap-10 md:gap-12 items-start px-2 md:px-10">
				<div className="flex-1 max-w-xl text-left mt-8">
					<h2 className="text-3xl md:text-4xl font-heading text-zinc-100 tracking-tight leading-tight">
						Spot banned people and prohibited items
					</h2>
					<p className="text-lg text-zinc-400 pt-4 font-light leading-relaxed">
						Share a live watchlist with the floor — photos, notes, and updates —
						so staff know who and what to look out for.
					</p>
				</div>
				<PhoneMockupShell heightClass="h-[520px]">
					<div className="flex w-3/4 h-9 items-center border-b border-zinc-800 shrink-0 pointer-events-none">
						<div className="flex flex-1 items-center justify-center gap-1.5 text-xs font-bold uppercase text-zinc-500">
							<BellRing className="size-3" />
							Incidents
						</div>
						<div className="flex flex-1 items-center justify-center gap-1.5 text-xs font-bold uppercase text-yellow-400">
							<Binoculars className="size-3" />
							Watchlist
						</div>
					</div>

					<div className="flex flex-row items-center justify-between py-2 border-b border-zinc-800 shrink-0 pointer-events-none">
						<p className="text-zinc-400 font-semibold text-sm leading-tight">
							Keep a lookout for these banned persons <br /> or prohibited
							items.
						</p>
					</div>

					<div className="relative flex-1 min-h-0 overflow-hidden">
						<div className={cn(container(), "pointer-events-none")}>
							{MOCK_WATCHLIST.map((entry) => (
								<PreviewWatchlistCard key={entry.id} entry={entry} />
							))}
						</div>
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10" />
					</div>
				</PhoneMockupShell>
			</div>
		</section>
	);
}
