import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { tv } from "tailwind-variants";
import { AlertItem } from "#/components/alerts/AlertItem";
import { AlertPanel } from "#/components/alerts/AlertPanel";
import {
	getAlertReadMap,
	setLastSeenForAlert,
	type AlertReadMap,
} from "#/lib/alertReadState";
import { formatTime12h } from "#/lib/utils";
import { getStaffAccessToken } from "#/lib/staffToken";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MAX_ACTIVE_ALERTS } from "../../../../convex/constants";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-0.5 pb-36",
	},
});

export const Route = createFileRoute("/live/_dashboard/alert")({
	component: AlertsTabComponent,
});

function AlertsTabComponent() {
	const { container } = layoutStyles();

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

	const eventId = profile?.eventId;
	const [expandedAlertId, setExpandedAlertId] =
		useState<Id<"alerts"> | null>(null);
	const [readMap, setReadMap] = useState<AlertReadMap>(() =>
		eventId ? getAlertReadMap(eventId) : {},
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

	useEffect(() => {
		if (eventId) {
			setReadMap(getAlertReadMap(eventId));
		}
	}, [eventId]);

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			<div className="flex flex-col gap-4">
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

			<div className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800 mt-2">
				<span className="text-zinc-400 font-black text-sm uppercase">
					Active Alerts ({" "}
					<span
						className={`font-bold ${activeAlerts.length >= MAX_ACTIVE_ALERTS ? "text-red-500" : "text-green-400"}`}
					>
						{activeAlerts.length}
					</span>
					<span className="font-bold">/ {MAX_ACTIVE_ALERTS} Max)</span>
				</span>
			</div>

			<div className={container()}>
				{activeAlerts.length === 0 ? (
					<p className="text-center text-zinc-500 text-sm py-8">
						No active alerts. Send one below.
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

			<AlertPanel isQueueFull={activeAlerts.length >= MAX_ACTIVE_ALERTS} />
		</div>
	);
}
