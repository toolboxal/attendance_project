import { useQuery } from "convex/react";
import { format } from "date-fns";
import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";

export function BroadcastBanner({ accessToken }: { accessToken: string }) {
	const activeBroadcast = useQuery(api.broadcasts.getActiveBroadcast, {
		accessToken,
	});
	const [isExpanded, setIsExpanded] = useState(false);
	const [lastSeenSignature, setLastSeenSignature] = useState<string | null>(
		null,
	);

	const activeSignature =
		activeBroadcast != null
			? `${activeBroadcast._id}:${activeBroadcast.content}`
			: null;

	useEffect(() => {
		if (activeSignature === null) {
			setIsExpanded(false);
			return;
		}
		if (activeSignature !== lastSeenSignature) {
			setLastSeenSignature(activeSignature);
			setIsExpanded(true);
		}
	}, [activeSignature, lastSeenSignature]);

	if (activeBroadcast === undefined || activeBroadcast === null) {
		return null;
	}

	return (
		<div className="pointer-events-none fixed top-3 left-1/2 z-60 w-[calc(100%-1rem)] max-w-md -translate-x-1/2">
			{!isExpanded && (
				<div className="flex justify-end">
					<button
						type="button"
						onClick={() => setIsExpanded(true)}
						aria-expanded={false}
						aria-label="Show broadcast"
						className="pointer-events-auto flex items-center justify-center rounded-full bg-red-700 p-2 text-red-100 opacity-70 transition-colors hover:bg-red-800"
					>
						<Megaphone className="size-4 text-zinc-100" />
					</button>
				</div>
			)}

			<div
				className={cn(
					"w-full transition-all duration-300 ease-out",
					isExpanded
						? "pointer-events-auto translate-y-0 opacity-100"
						: "pointer-events-none hidden",
				)}
			>
				<div className="rounded-2xl  bg-red-200 p-4">
					<div className="mb-2 flex items-start justify-between gap-2">
						<div className="flex items-center gap-2 text-red-700">
							{/* <Megaphone className="size-4 shrink-0" strokeWidth={2.5} /> */}
							<span className="text-xs font-bold uppercase tracking-wide">
								Important Broadcast From Admin
							</span>
						</div>
						<button
							type="button"
							onClick={() => setIsExpanded(false)}
							aria-label="Dismiss broadcast"
							className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
						>
							<X className="size-4" />
						</button>
					</div>
					<p className="text-sm font-medium leading-snug text-red-800">
						{activeBroadcast.content}
					</p>
					<p className="mt-2 text-[10px] text-red-800">
						{activeBroadcast.createdByName} ·{" "}
						{format(activeBroadcast.createdAt, "h:mm a")}
					</p>
				</div>
			</div>
		</div>
	);
}
