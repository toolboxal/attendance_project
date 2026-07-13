import { BellRing, Binoculars } from "lucide-react";
import { useCallback, useState } from "react";
import { tv } from "tailwind-variants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { DemoAlertItem } from "#/demo/components/DemoAlertItem";
import { DemoAlertPanel } from "#/demo/components/DemoAlertPanel";
import { DemoProfileHeader } from "#/demo/components/DemoProfileHeader";
import { DemoWatchlistItem } from "#/demo/components/DemoWatchlistItem";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import { cn } from "#/lib/utils";
import { MAX_ACTIVE_ALERTS } from "../../../convex/constants";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 min-h-0",
		alertsContainer: "pb-36",
	},
});

export function DemoAlertsTab() {
	const { container, alertsContainer } = layoutStyles();
	const { state } = useDemoFloor();
	const { profile, alerts, watchlist } = state;
	const [panelTab, setPanelTab] = useState<"alerts" | "watchlist">("alerts");
	const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
	const [expandedWatchlistId, setExpandedWatchlistId] = useState<string | null>(
		null,
	);

	const activeAlerts = alerts.filter((alert) => alert.status === "open");

	const toggleExpandAlert = useCallback((alertId: string) => {
		setExpandedAlertId((prev) => (prev === alertId ? null : alertId));
	}, []);

	const toggleExpandWatchlist = useCallback((entryId: string) => {
		setExpandedWatchlistId((prev) => (prev === entryId ? null : entryId));
	}, []);

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			<DemoProfileHeader profile={profile} />

			<Tabs
				value={panelTab}
				onValueChange={(v) => setPanelTab(v as "alerts" | "watchlist")}
				className="flex flex-1 flex-col min-h-0 mt-2"
			>
				<TabsList
					variant="line"
					className="w-3/4 h-9 bg-transparent border-b border-zinc-800 rounded-none p-0"
				>
					<TabsTrigger
						value="alerts"
						className="flex-1 text-xs font-bold uppercase data-active:text-yellow-400 text-zinc-500"
					>
						<span className="inline-flex items-center gap-1.5">
							<BellRing className="size-3" />
							Incidents
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="watchlist"
						className="flex-1 text-xs font-bold uppercase data-active:text-yellow-400 text-zinc-500"
					>
						<span className="inline-flex items-center gap-1.5">
							<Binoculars className="size-3" />
							Watchlist
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

					<div className={cn(container(), alertsContainer())}>
						{activeAlerts.length === 0 ? (
							<p className="text-center text-zinc-400 text-sm py-8">
								Incident reporting is for issues like security,
								<br /> medical, lost person, broken chairs, etc.
							</p>
						) : (
							activeAlerts.map((alert) => (
								<DemoAlertItem
									key={alert.id}
									alert={alert}
									currentStaffId={profile.id}
									isSupervisor={profile.isSupervisor}
									expanded={expandedAlertId === alert.id}
									onToggleExpand={() => toggleExpandAlert(alert.id)}
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
						{watchlist.length === 0 ? (
							<p className="text-center text-zinc-400 text-sm py-8">
								Your admin has not published any banned persons or prohibited
								items yet.
							</p>
						) : (
							watchlist.map((entry) => (
								<DemoWatchlistItem
									key={entry.id}
									entry={entry}
									currentStaffId={profile.id}
									expanded={expandedWatchlistId === entry.id}
									onToggleExpand={() => toggleExpandWatchlist(entry.id)}
								/>
							))
						)}
					</div>
				</TabsContent>
			</Tabs>

			{panelTab === "alerts" && (
				<DemoAlertPanel isQueueFull={activeAlerts.length >= MAX_ACTIVE_ALERTS} />
			)}
		</div>
	);
}
