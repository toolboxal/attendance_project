import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	Popover,
	PopoverContent,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Button } from "#/components/ui/button";
import { cn, formatRelativeTime } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

function formatAlertType(alertType: string) {
	return alertType.replace(/_/g, " ");
}

export function AdminNotificationBell() {
	const navigate = useNavigate();
	const notifications = useQuery(api.adminNotifications.getAdminAlertNotifications);
	const markSeen = useMutation(api.adminNotifications.markAdminAlertsSeen);
	const enterLiveFloor = useMutation(api.liveStaff.enterLiveFloorAsAdmin);
	const [open, setOpen] = useState(false);
	const [isEntering, setIsEntering] = useState(false);

	const unreadCount = notifications?.unreadCount ?? 0;

	const handleMarkAllRead = async () => {
		if (!notifications?.eventId) return;
		try {
			await markSeen({ eventId: notifications.eventId });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to mark notifications read",
			);
		}
	};

	const handleOpenAlert = async (alertId: Id<"alerts">) => {
		if (!notifications?.eventId) return;
		try {
			setIsEntering(true);
			await markSeen({
				eventId: notifications.eventId,
				alertIds: [alertId],
			});
			const { accessToken } = await enterLiveFloor({
				eventId: notifications.eventId,
			});
			localStorage.setItem("asistir_staff_token", accessToken);
			setOpen(false);
			navigate({ to: "/live/alert" });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to open live alerts",
			);
		} finally {
			setIsEntering(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="relative flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
					aria-label={
						unreadCount > 0
							? `${unreadCount} unread live alert notifications`
							: "Live alert notifications"
					}
				>
					<Bell className="size-5" />
					{unreadCount > 0 ? (
						<span className="absolute -top-0.5 -right-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					) : null}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-80 border-zinc-800 bg-zinc-950 p-0 text-zinc-100 shadow-xl ring-zinc-800"
			>
				<PopoverHeader className="border-b border-zinc-800 px-4 py-3">
					<div className="flex items-center justify-between gap-2">
						<PopoverTitle className="text-sm font-semibold text-zinc-100">
							Live alerts
						</PopoverTitle>
						{unreadCount > 0 && notifications?.eventId ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-auto px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100"
								onClick={handleMarkAllRead}
							>
								Mark all read
							</Button>
						) : null}
					</div>
					{notifications?.eventTitle ? (
						<p className="text-xs text-zinc-500 truncate">
							{notifications.eventTitle}
						</p>
					) : null}
				</PopoverHeader>

				<div className="max-h-80 overflow-y-auto">
					{notifications === undefined ? (
						<p className="px-4 py-6 text-center text-xs text-zinc-500">
							Loading…
						</p>
					) : !notifications.eventId ? (
						<p className="px-4 py-6 text-center text-xs text-zinc-500">
							No live event right now.
						</p>
					) : notifications.items.length === 0 ? (
						<p className="px-4 py-6 text-center text-xs text-zinc-500">
							All quiet on the floor.
						</p>
					) : (
						<ul className="divide-y divide-zinc-800/80">
							{notifications.items.map((item) => (
								<li key={item.alertId}>
									<button
										type="button"
										disabled={isEntering}
										onClick={() => handleOpenAlert(item.alertId)}
										className={cn(
											"flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-zinc-900/80",
											item.isPinned && "bg-amber-500/5",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
												{formatAlertType(item.alertType)}
											</span>
											<span className="text-[10px] text-zinc-500">
												{formatRelativeTime(item.createdAt)}
											</span>
										</div>
										<p className="text-sm font-medium text-zinc-100 line-clamp-2">
											{item.body}
										</p>
										<p className="text-[11px] text-zinc-500">
											{item.sectionName ?? "Event"} · {item.creatorName}
											{item.kind === "alert_update"
												? " · new update"
												: " · new alert"}
										</p>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
