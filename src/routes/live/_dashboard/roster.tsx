import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/live/_dashboard/roster")({
	component: RosterTabComponent,
});

function RosterTabComponent() {
	return (
		<div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div>
				<h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">Duty Roster</h1>
				<p className="text-zinc-500 text-sm mt-1">View active personnel and dispatch details.</p>
			</div>

			{/* High-end Empty State Visual */}
			<div className="mt-8 bg-zinc-900/40 backdrop-blur border border-zinc-800/60 rounded-3xl p-12 flex flex-col items-center text-center border-dashed">
				<div className="size-12 bg-zinc-800/50 border border-zinc-700/30 rounded-2xl flex items-center justify-center text-zinc-500 mb-6">
					<ShieldCheck className="size-5 animate-pulse" />
				</div>
				<h3 className="text-sm font-bold text-zinc-300">Awaiting Rollcall</h3>
				<p className="text-zinc-600 text-xs mt-2 max-w-xs">
					Active staff manifests will sync once the next roster segment initializes. 📑
				</p>
			</div>
		</div>
	);
}
