import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "#/lib/utils";

type WatchlistEntry = FunctionReturnType<
	typeof api.watchlist.listForEvent
>[number];

const KIND_LABELS: Record<WatchlistEntry["kind"], string> = {
	banned_person: "Banned person",
	prohibited_item: "Prohibited item",
};

export function WatchlistEntryCard({
	entry,
	readOnly,
}: {
	entry: WatchlistEntry;
	readOnly: boolean;
}) {
	const removeEntry = useMutation(api.watchlist.remove);

	const handleRemove = async () => {
		try {
			await removeEntry({ entryId: entry._id });
			toast.success("Entry removed from watchlist.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to remove entry.",
			);
		}
	};

	return (
		<div className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
			{entry.photoUrl ? (
				<a
					href={entry.photoUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="shrink-0 size-20 rounded-lg overflow-hidden border border-zinc-700"
				>
					<img
						src={entry.photoUrl}
						alt={entry.label}
						className="size-full object-cover"
					/>
				</a>
			) : (
				<div className="shrink-0 size-20 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 flex items-center justify-center text-[10px] text-zinc-500 text-center px-1">
					No photo
				</div>
			)}

			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<span
							className={cn(
								"text-[10px] font-bold uppercase tracking-wider",
								entry.kind === "banned_person"
									? "text-red-400"
									: "text-amber-400",
							)}
						>
							{KIND_LABELS[entry.kind]}
						</span>
						<p className="text-zinc-100 font-semibold truncate">{entry.label}</p>
					</div>
					{!readOnly && (
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="shrink-0 text-zinc-400 hover:text-red-400"
							onClick={handleRemove}
							aria-label={`Remove ${entry.label}`}
						>
							<Trash2 className="size-4" />
						</Button>
					)}
				</div>
				{entry.notes && (
					<p className="text-zinc-400 text-xs line-clamp-3">{entry.notes}</p>
				)}
				{entry.updateCount > 0 && entry.latestUpdate && (
					<p className="text-zinc-500 text-[11px] italic">
						{entry.updateCount} helper update
						{entry.updateCount === 1 ? "" : "s"}
					</p>
				)}
			</div>
		</div>
	);
}
