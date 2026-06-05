import { useCallback, useState, type ComponentProps } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { WatchlistItem } from "#/components/alerts/WatchlistItem";
import type { WatchlistReadMap } from "#/lib/watchlistReadState";

type WatchlistEntry = ComponentProps<typeof WatchlistItem>["entry"];

export function WatchlistPanel({
	entries,
	currentStaffId,
	readMap,
	onMarkSeen,
}: {
	entries: WatchlistEntry[];
	currentStaffId?: Id<"liveStaff">;
	readMap: WatchlistReadMap;
	onMarkSeen: (entryId: Id<"eventWatchlist">, updateCount: number) => void;
}) {
	const [expandedEntryId, setExpandedEntryId] =
		useState<Id<"eventWatchlist"> | null>(null);

	const toggleExpand = useCallback((entryId: Id<"eventWatchlist">) => {
		setExpandedEntryId((prev) => (prev === entryId ? null : entryId));
	}, []);

	if (entries.length === 0) {
		return (
			<p className="text-center text-zinc-500 text-sm py-8">
				No watchlist entries for this event. Your admin has not published any
				banned persons or prohibited items yet.
			</p>
		);
	}

	return (
		<>
			{entries.map((entry) => (
				<WatchlistItem
					key={entry._id}
					entry={entry}
					currentStaffId={currentStaffId}
					expanded={expandedEntryId === entry._id}
					onToggleExpand={() => toggleExpand(entry._id)}
					readMap={readMap}
					onMarkSeen={onMarkSeen}
				/>
			))}
		</>
	);
}
