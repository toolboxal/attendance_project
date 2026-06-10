import { cn } from "#/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

export type RosterSlotRowData = {
	rowKey: string;
	slotId?: Id<"roleSlots">;
	title: string;
	role: "supervisor" | "staff";
	description?: string;
	assignedStaffId?: Id<"liveStaff">;
	staffName?: string;
	staffStatus?: "unclaimed" | "active" | "checked_out";
	isViewer: boolean;
};

function OccupantLine({ slot }: { slot: RosterSlotRowData }) {
	if (!slot.assignedStaffId) {
		return <p className="text-[11px] text-zinc-500 italic">Vacant</p>;
	}

	if (slot.staffStatus === "checked_out") {
		return (
			<p className="text-[11px] text-zinc-500">
				<span className="line-through opacity-70">{slot.staffName}</span>
				<span className="ml-1.5 not-italic">· Checked out</span>
			</p>
		);
	}

	if (slot.staffStatus === "unclaimed") {
		return (
			<p className="text-[11px] text-zinc-400">
				{slot.staffName}
				<span className="ml-1.5 text-zinc-500">· Not checked in</span>
			</p>
		);
	}

	if (slot.staffStatus === "active") {
		return (
			<p className="text-[11px] text-emerald-300/90">
				{slot.staffName}
				<span className="ml-1.5 text-emerald-400/80">· Active</span>
			</p>
		);
	}

	return (
		<p className="text-[11px] text-zinc-400">{slot.staffName ?? "Assigned"}</p>
	);
}

export function RosterSlotRow({ slot }: { slot: RosterSlotRowData }) {
	return (
		<div
			className={cn(
				"rounded-lg bg-zinc-900/80 border px-2.5 py-2 space-y-1",
				slot.isViewer
					? "border-yellow-500/50 ring-1 ring-yellow-500/20"
					: "border-zinc-800/80",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<p className="text-sm font-semibold text-zinc-100 leading-tight">
					{slot.title}
				</p>
				<div className="flex items-center gap-1.5 shrink-0">
					{slot.isViewer && (
						<span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
							You
						</span>
					)}
					<span
						className={cn(
							"text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
							slot.role === "supervisor"
								? "text-emerald-400 bg-emerald-400/10"
								: "text-yellow-400 bg-yellow-400/10",
						)}
					>
						{slot.role}
					</span>
				</div>
			</div>
			{slot.description ? (
				<p className="text-[11px] text-zinc-500 leading-snug">
					{slot.description}
				</p>
			) : null}
			<OccupantLine slot={slot} />
		</div>
	);
}
