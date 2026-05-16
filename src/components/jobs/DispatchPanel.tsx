import { useMutation } from "convex/react";
import { Minus, Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "#/components/ui/input";
import { api } from "../../../convex/_generated/api";

export function DispatchPanel() {
	const [personCount, setPersonCount] = useState(1);
	const [requestType, setRequestType] = useState("regular");
	const [description, setDescription] = useState("");

	const dispatchJob = useMutation(api.jobs.dispatchJob);

	return (
		<div className="fixed bottom-26 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md bg-zinc-900/90 backdrop-blur-2xl rounded-2xl  p-3 shadow-2xl z-40 flex flex-col gap-3">
			{/* Tags Row */}
			<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
				{["regular", "elderly", "family", "wheelchair", "vip"].map((tag) => (
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
				))}
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
	);
}
