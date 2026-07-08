import { Link } from "@tanstack/react-router";
import { DemoBottomNav } from "#/demo/components/DemoBottomNav";
import { DemoFloorProvider, useDemoFloor } from "#/demo/DemoFloorContext";
import { DemoAlertsTab } from "#/demo/tabs/DemoAlertsTab";
import { DemoJobsTab } from "#/demo/tabs/DemoJobsTab";
import { DemoRosterTab } from "#/demo/tabs/DemoRosterTab";

function DemoFloorContent() {
	const { activeTab, resetDemo } = useDemoFloor();

	return (
		<div className="min-h-dvh bg-zinc-950 text-zinc-100">
			<div className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
				<div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
					<Link to="/" className="text-xs font-medium text-zinc-400 hover:text-zinc-100">
						← Back
					</Link>
					<p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
						Live floor demo
					</p>
					<button
						type="button"
						onClick={resetDemo}
						className="text-xs font-medium text-zinc-400 hover:text-zinc-100"
					>
						Reset
					</button>
				</div>
			</div>

			<main className="w-full max-w-md mx-auto px-1 pt-2 bg-zinc-950">
				{activeTab === "jobs" && <DemoJobsTab />}
				{activeTab === "alert" && <DemoAlertsTab />}
				{activeTab === "roster" && <DemoRosterTab />}
			</main>

			<DemoBottomNav />
		</div>
	);
}

export function DemoFloorApp() {
	return (
		<DemoFloorProvider>
			<DemoFloorContent />
		</DemoFloorProvider>
	);
}
