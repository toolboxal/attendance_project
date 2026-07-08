import { tv } from "tailwind-variants";
import { DemoAlertItem } from "#/demo/components/DemoAlertItem";
import { DemoAlertPanel } from "#/demo/components/DemoAlertPanel";
import { DemoProfileHeader } from "#/demo/components/DemoProfileHeader";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import { cn } from "#/lib/utils";
import { MAX_ACTIVE_ALERTS } from "../../../convex/constants";

const layoutStyles = tv({
	slots: {
		container:
			"flex-1 overflow-y-auto py-2 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-0.5 min-h-0 pb-36",
	},
});

export function DemoAlertsTab() {
	const { container } = layoutStyles();
	const { state } = useDemoFloor();
	const { profile, alerts } = state;

	const activeAlerts = alerts.filter((alert) => alert.status === "open");

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			<DemoProfileHeader profile={profile} />

			<div className="flex flex-row items-center justify-between py-2 border-b border-zinc-800 shrink-0 mt-2">
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

			<div className={container()}>
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
						/>
					))
				)}
			</div>

			<DemoAlertPanel isQueueFull={activeAlerts.length >= MAX_ACTIVE_ALERTS} />
		</div>
	);
}
