import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Minus, Plus, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "../../../../convex/_generated/api";
import { format } from "date-fns";
import { formatTime12h } from "#/lib/utils";
import { Input } from "#/components/ui/input";

export const Route = createFileRoute("/live/_dashboard/jobs")({
	component: JobsTabComponent,
});

function JobsTabComponent() {
	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, {
			accessToken: localStorage.getItem("asistir_staff_token") ?? "",
		}),
	);
	const [isDispatchMode, setIsDispatchMode] = useState(false);
	const [personCount, setPersonCount] = useState(1);
	const [requestType, setRequestType] = useState("regular");
	const [description, setDescription] = useState("");

	const dispatchJob = useMutation(api.jobs.dispatchJob);

	return (
		<div className="flex flex-col gap-6 bg-zinc-950 pb-32">
			{/* Header Area */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-row items-start justify-between">
					<div className="flex flex-col">
						<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
							{profile?.sectionName.toUpperCase()}
						</p>
						<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
							{profile?.roleTitle}
						</p>
						<p className="text-xs font-extrabold text-zinc-400 tracking-tight">
							{profile?.role}
						</p>
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
				<div className="flex items-center space-x-2">
					<Switch
						id="Dispatch"
						checked={isDispatchMode}
						onCheckedChange={setIsDispatchMode}
					/>
					<Label htmlFor="Dispatch" className="text-zinc-300 font-semibold">
						Entrance Crowd Controller
					</Label>
				</div>
			</div>

			{/* Queue Content (Placeholder) */}
			{!isDispatchMode && (
				<div className="mt-4 bg-zinc-900/40 backdrop-blur border border-zinc-800/60 rounded-3xl p-12 flex flex-col items-center text-center border-dashed">
					<div className="size-12 bg-zinc-800/50 border border-zinc-700/30 rounded-2xl flex items-center justify-center text-zinc-500 mb-6">
						<Sparkles className="size-5 animate-pulse" />
					</div>
					<h3 className="text-sm font-bold text-zinc-300">Queue is Empty</h3>
					<p className="text-zinc-600 text-xs mt-2 max-w-xs">
						No active requests have been dispatched to your sector yet. Grab a
						coffee! ☕️
					</p>
				</div>
			)}

			{/* 🚀 FIXED DISPATCH PANEL (Appears when Traffic Controller is ON) */}
			{isDispatchMode && (
				<div className="fixed bottom-26 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md bg-zinc-900/90 backdrop-blur-2xl rounded-2xl  p-3 shadow-2xl z-40 flex flex-col gap-3">
					{/* Tags Row */}
					<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
						{["regular", "elderly", "family", "wheelchair", "vip"].map(
							(tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => setRequestType(tag)}
									className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors shrink-0 ${
										requestType === tag
											? "bg-yellow-200 text-zinc-950"
											: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
									}`}
								>
									{tag}
								</button>
							),
						)}
					</div>

					{/* Compose Row */}
					<div className="flex items-center gap-2">
						{/* Number Stepper */}
						<div className="flex items-center bg-zinc-950/50 rounded-xl overflow-hidden border border-zinc-800/80 shrink-0">
							<button
								type="button"
								onClick={() => setPersonCount(Math.max(1, personCount - 1))}
								className="px-3 py-2.5 text-zinc-400 hover:text-zinc-100 transition-colors"
							>
								<Minus className="size-4" />
							</button>
							<span className="w-5 text-center text-zinc-100 font-bold text-sm">
								{personCount}
							</span>
							<button
								type="button"
								onClick={() => setPersonCount(personCount + 1)}
								className="px-3 py-2.5 text-zinc-400 hover:text-zinc-100 transition-colors"
							>
								<Plus className="size-4" />
							</button>
						</div>

						{/* Short Description Input */}
						<Input
							type="text"
							placeholder="Short note..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
						/>

						{/* Send Button */}
						<button
							type="button"
							onClick={async () => {
								if (personCount < 1) return;
								try {
									await dispatchJob({
										accessToken: localStorage.getItem("asistir_staff_token") ?? "",
										personCount,
										requestType,
										description: description.trim() || undefined,
									});
									toast.success("Job Dispatched!");
									setDescription("");
									setPersonCount(1);
									setRequestType("regular");
								} catch (err: any) {
									toast.error(err.message || "Failed to dispatch");
								}
							}}
							className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl p-3 transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-lg"
						>
							<Send className="size-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
