import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { format } from "date-fns";

import { useState } from "react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { AdminEventControls } from "#/components/admin/AdminEventControls";
import { AdminOperationalPost } from "#/components/admin/AdminOperationalPost";
import { AdminStaffManagement } from "#/components/admin/AdminStaffManagement";
import { BroadcastPanel } from "#/components/broadcast/BroadcastPanel";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { useLiveCountdown } from "#/hooks/use-live-countdown";
import { getStaffAccessToken } from "#/lib/staffToken";
import { cn } from "#/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const layoutStyles = tv({
	slots: {
		container:
			"flex flex-col h-[calc(100dvh-5.5rem)] bg-zinc-950 overflow-hidden",
		scroll:
			"flex-1 overflow-y-auto py-2 px-1 pb-36 min-h-0 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
		historyItem:
			"rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 space-y-2",
	},
});

export const Route = createFileRoute("/live/_dashboard/admin")({
	component: AdminTabComponent,
});

function AdminTabComponent() {
	const { container, scroll, historyItem } = layoutStyles();
	const accessToken = getStaffAccessToken();

	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, { accessToken }),
	);
	const { data: history } = useSuspenseQuery(
		convexQuery(api.broadcasts.getBroadcastHistory, { accessToken }),
	);

	const deactivateBroadcast = useMutation(api.broadcasts.deactivateBroadcast);
	const setActiveBroadcast = useMutation(api.broadcasts.setActiveBroadcast);
	const deleteBroadcast = useMutation(api.broadcasts.deleteBroadcast);

	const [pendingId, setPendingId] = useState<Id<"broadcasts"> | null>(null);
	const timeRemaining = useLiveCountdown(profile?.expiresAt ?? null);

	if (!profile?.isAdmin) {
		return <Navigate to="/live/jobs" replace />;
	}

	const handleDeactivate = async (broadcastId: Id<"broadcasts">) => {
		setPendingId(broadcastId);
		try {
			await deactivateBroadcast({ accessToken, broadcastId });
			toast.success("Broadcast deactivated.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to deactivate broadcast",
			);
		} finally {
			setPendingId(null);
		}
	};

	const handleSetActive = async (broadcastId: Id<"broadcasts">) => {
		setPendingId(broadcastId);
		try {
			await setActiveBroadcast({ accessToken, broadcastId });
			toast.success("Broadcast is now live.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to activate broadcast",
			);
		} finally {
			setPendingId(null);
		}
	};

	const handleDelete = async (broadcastId: Id<"broadcasts">) => {
		setPendingId(broadcastId);
		try {
			await deleteBroadcast({ accessToken, broadcastId });
			toast.success("Broadcast deleted.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete broadcast",
			);
		} finally {
			setPendingId(null);
		}
	};

	return (
		<div className={container()}>
			{profile.expiresAt != null ? (
				<div className="shrink-0 flex px-1 py-1">
					<div className="flex items-center gap-1.5 text-sm font-mono font-bold text-zinc-400">
						<span>Event ends in</span>
						<span className="underline underline-offset-4">
							{timeRemaining}
						</span>
					</div>
				</div>
			) : null}
			<AdminEventControls />
			<div className={scroll()}>
				<AdminOperationalPost />

				<div className="h-px bg-zinc-700 my-4" />
				<AdminStaffManagement />

				<div className="flex flex-col px-0 pb-2 shrink-0">
					<p className="text-md font-bold text-zinc-50">Broadcasts</p>
					<p className="text-xs text-zinc-300">
						Send a message to all staff. Only one broadcast is active at a time.
					</p>
				</div>

				{history.length === 0 ? (
					<p className="text-xs text-zinc-500 px-1">No broadcasts yet.</p>
				) : (
					history.map((item) => (
						<div key={item._id} className={historyItem()}>
							<div className="flex items-center justify-between gap-2">
								<span
									className={cn(
										"text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
										item.status === "active"
											? "bg-yellow-600/20 text-yellow-400"
											: "bg-zinc-700 text-zinc-400",
									)}
								>
									{item.status === "active" ? "Active" : "Inactive"}
								</span>
								<span className="text-[10px] text-zinc-500">
									{format(item.createdAt, "MMM d, h:mm a")}
								</span>
							</div>
							<p className="text-sm text-zinc-200 line-clamp-3">
								{item.content}
							</p>
							<div className="flex flex-wrap gap-2">
								{item.status === "active" ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={pendingId === item._id}
										onClick={() => handleDeactivate(item._id)}
										className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
									>
										Deactivate
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={pendingId === item._id}
										onClick={() => handleSetActive(item._id)}
										className="border-yellow-600/40 text-yellow-400 hover:bg-yellow-900/30"
									>
										Show
									</Button>
								)}
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={pendingId === item._id}
									onClick={() => handleDelete(item._id)}
									className="border-red-900/50 text-red-400 hover:bg-red-950/40"
								>
									Delete
								</Button>
							</div>
						</div>
					))
				)}
			</div>

			<BroadcastPanel />
		</div>
	);
}
