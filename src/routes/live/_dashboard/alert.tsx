import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { tv } from "tailwind-variants";
import { AlertItem } from "#/components/alerts/AlertItem";
import { AlertPanel } from "#/components/alerts/AlertPanel";
import { WatchlistPanel } from "#/components/alerts/WatchlistPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
	type AlertReadMap,
	getAlertReadMap,
	getUnreadUpdateCount,
	setLastSeenForAlert,
} from "#/lib/alertReadState";
import {
	type WatchlistReadMap,
	getUnreadWatchlistUpdateCount,
	getWatchlistReadMap,
	setLastSeenForWatchlistEntry,
} from "#/lib/watchlistReadState";
import { getStaffAccessToken } from "#/lib/staffToken";
import { cn, formatTime12h } from "#/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MAX_ACTIVE_ALERTS } from "../../../../convex/constants";
import { BellRing, Binoculars } from "lucide-react";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 min-h-0",
		alertsContainer: "pb-36",
	},
});

export const Route = createFileRoute("/live/_dashboard/alert")({
	component: AlertsTabComponent,
});

function AlertsTabComponent() {
	const { container, alertsContainer } = layoutStyles();

	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, {
			accessToken: getStaffAccessToken(),
		}),
	);
	const { data: activeAlerts } = useSuspenseQuery(
		convexQuery(api.alerts.getActiveAlerts, {
			accessToken: getStaffAccessToken(),
		}),
	);
	const { data: watchlistEntries } = useSuspenseQuery(
		convexQuery(api.watchlist.getActiveForLive, {
			accessToken: getStaffAccessToken(),
		}),
	);

	const eventId = profile?.eventId;
	const [activeTab, setActiveTab] = useState<"alerts" | "watchlist">("alerts");
	const [expandedAlertId, setExpandedAlertId] = useState<Id<"alerts"> | null>(
		null,
	);
	const [readMap, setReadMap] = useState<AlertReadMap>(() =>
		eventId ? getAlertReadMap(eventId) : {},
	);
	const [watchlistReadMap, setWatchlistReadMap] = useState<WatchlistReadMap>(
		() => (eventId ? getWatchlistReadMap(eventId) : {}),
	);

	const toggleExpand = useCallback((alertId: Id<"alerts">) => {
		setExpandedAlertId((prev) => (prev === alertId ? null : alertId));
	}, []);

	const markAlertSeen = useCallback(
		(alertId: Id<"alerts">, updateCount: number) => {
			if (!eventId) return;
			setReadMap(setLastSeenForAlert(eventId, alertId, updateCount));
		},
		[eventId],
	);

	const markWatchlistSeen = useCallback(
		(entryId: Id<"eventWatchlist">, updateCount: number) => {
			if (!eventId) return;
			setWatchlistReadMap(
				setLastSeenForWatchlistEntry(eventId, entryId, updateCount),
			);
		},
		[eventId],
	);

	useEffect(() => {
		if (eventId) {
			setReadMap(getAlertReadMap(eventId));
			setWatchlistReadMap(getWatchlistReadMap(eventId));
		}
	}, [eventId]);

	const totalAlertsUnread = useMemo(
		() =>
			activeAlerts.reduce(
				(sum, alert) =>
					sum + getUnreadUpdateCount(alert.updateCount, alert._id, readMap),
				0,
			),
		[activeAlerts, readMap],
	);

	const totalWatchlistUnread = useMemo(
		() =>
			watchlistEntries.reduce(
				(sum, entry) =>
					sum +
					getUnreadWatchlistUpdateCount(
						entry.updateCount,
						entry._id,
						watchlistReadMap,
					),
				0,
			),
		[watchlistEntries, watchlistReadMap],
	);

	const canParticipateOnFloor =
		!profile?.isAdmin || profile.hasOperationalPost === true;

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			<div className="flex flex-col gap-4 shrink-0">
				<div className="flex flex-row items-start justify-between">
					<div className="flex flex-col">
						<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
							{profile?.sectionName?.toUpperCase() ?? "EVENT"}
						</p>
						<p className="text-xs font-extrabold text-zinc-300 tracking-tight">
							{profile?.roleTitle}
						</p>
						<div className="flex flex-row gap-1 items-center">
							<p className="text-xs font-extrabold text-yellow-400 tracking-tight italic">
								{profile?.name}
							</p>
							<p className="text-xs font-extrabold text-yellow-400 tracking-tight italic">
								{profile?.role}
							</p>
						</div>
					</div>
					<div className="flex flex-col">
						<span className="text-zinc-200 text-xs font-semibold self-end">
							{profile?.eventDate
								? format(new Date(profile.eventDate), "PPPP")
								: "Date TBD"}
						</span>
						<span className="text-yellow-200 text-xs font-mono self-end">
							{profile?.sectionStartTime
								? formatTime12h(profile.sectionStartTime)
								: profile?.eventTime
									? formatTime12h(profile.eventTime)
									: "Time TBD"}
							{profile?.sectionEndTime
								? ` - ${formatTime12h(profile.sectionEndTime)}`
								: ""}
						</span>
					</div>
				</div>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as "alerts" | "watchlist")}
				className="flex flex-1 flex-col min-h-0 mt-2"
			>
				<TabsList
					variant="line"
					className="w-3/4 h-9  bg-transparent border-b border-zinc-800 rounded-none p-0"
				>
					<TabsTrigger
						value="alerts"
						className="flex-1 text-xs font-bold uppercase data-active:text-yellow-400 text-zinc-500"
					>
						<span className="inline-flex items-center gap-1.5">
							<BellRing className="size-3" />
							Incidents
							{totalAlertsUnread > 0 && (
								<span
									className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-zinc-50"
									title={`${totalAlertsUnread} unread incident updates`}
								>
									{totalAlertsUnread}
								</span>
							)}
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="watchlist"
						className="flex-1 text-xs font-bold uppercase data-active:text-yellow-400 text-zinc-500"
					>
						<span className="inline-flex items-center gap-1.5">
							<Binoculars className="size-3" />
							Watchlist
							{totalWatchlistUnread > 0 && (
								<span
									className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-zinc-50"
									title={`${totalWatchlistUnread} unread watchlist updates`}
								>
									{totalWatchlistUnread}
								</span>
							)}
						</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="alerts"
					className="flex flex-1 flex-col min-h-0 mt-0 data-[state=inactive]:hidden"
				>
					<div className="flex flex-row items-center justify-between py-2 border-b border-zinc-800 shrink-0">
						<span className="text-zinc-400 font-black text-sm uppercase">
							Active Alerts ({" "}
							<span
								className={cn(
									"font-bold",
									activeAlerts.length >= MAX_ACTIVE_ALERTS
										? "text-red-500"
										: "text-green-400",
								)}
							>
								{activeAlerts.length}
							</span>
							<span className="font-bold">/ {MAX_ACTIVE_ALERTS} Max)</span>
						</span>
					</div>

					{profile?.isAdmin && !canParticipateOnFloor && (
						<p className="text-xs text-yellow-100 mt-2 px-0.5">
							To Admin: assign yourself to a role and section on the Admin tab
							to raise alerts from the floor.
						</p>
					)}

					<div className={cn(container(), alertsContainer())}>
						{activeAlerts.length === 0 ? (
							<p className="text-center text-zinc-400 text-sm py-8">
								Incident reporting is for issues like security,
								<br /> medical, lost person, broken chairs, etc.
							</p>
						) : (
							activeAlerts.map((alert) => (
								<AlertItem
									key={alert._id}
									alert={alert}
									currentStaffId={profile?._id}
									expanded={expandedAlertId === alert._id}
									onToggleExpand={() => toggleExpand(alert._id)}
									readMap={readMap}
									onMarkSeen={markAlertSeen}
								/>
							))
						)}
					</div>
				</TabsContent>

				<TabsContent
					value="watchlist"
					className="flex flex-1 flex-col min-h-0 mt-0 data-[state=inactive]:hidden"
				>
					<div className="flex flex-row items-center justify-between py-2 border-b border-zinc-800 shrink-0">
						<p className="text-zinc-400 font-semibold text-sm leading-tight">
							Keep a lookout for these banned persons <br /> or prohibited
							items.
						</p>
					</div>

					<div className={cn(container(), "pb-4")}>
						<WatchlistPanel
							entries={watchlistEntries}
							currentStaffId={profile?._id}
							readMap={watchlistReadMap}
							onMarkSeen={markWatchlistSeen}
						/>
					</div>
				</TabsContent>
			</Tabs>

			{activeTab === "alerts" && canParticipateOnFloor && (
				<AlertPanel isQueueFull={activeAlerts.length >= MAX_ACTIVE_ALERTS} />
			)}
		</div>
	);
}
