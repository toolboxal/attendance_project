import { cn, formatStaffRoleLabel } from "#/lib/utils";
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
	isAdminCover?: boolean;
};

function OccupantLine({ slot }: { slot: RosterSlotRowData }) {
	if (!slot.assignedStaffId) {
		return <p className="text-xs font-bold text-zinc-500 italic">Vacant</p>;
	}

	if (slot.staffStatus === "checked_out") {
		return (
			<p className="text-xs font-bold text-zinc-500 mb-0.5">
				<span className="line-through opacity-70">{slot.staffName}</span>
				<span className="ml-1.5 not-italic">· Checked out</span>
			</p>
		);
	}

	if (slot.staffStatus === "unclaimed") {
		return (
			<p className="text-xs font-bold text-zinc-400 mb-0.5">
				{slot.staffName}
				<span className="ml-1.5 text-zinc-500">· Not checked in</span>
			</p>
		);
	}

	if (slot.staffStatus === "active") {
		return (
			<p className="text-xs font-bold text-yellow-300 mb-0.5">
				{slot.staffName}
				<span className="ml-1.5 text-zinc-300">· Active</span>
			</p>
		);
	}

	return (
		<p className="text-[11px] text-zinc-400 mb-0.5">
			{slot.staffName ?? "Assigned"}
		</p>
	);
}

export function RosterSlotRow({ slot }: { slot: RosterSlotRowData }) {
	return (
		<div
			className={
				" bg-zinc-950 border p-2 flex flex-row items-start justify-between"
			}
		>
			<div className="flex flex-col">
				<OccupantLine slot={slot} />
				<p className="text-xs font-semibold text-zinc-100">{slot.title}</p>
				{slot.description ? (
					<p className="text-[12px] text-zinc-300">{slot.description}</p>
				) : null}
			</div>

			<div className="flex items-center gap-1.5 shrink-0">
				<span
					className={cn(
						"text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
						slot.isAdminCover ? " text-yellow-400" : "text-zinc-400",
					)}
				>
					{slot.isAdminCover ? "Admin" : formatStaffRoleLabel(slot.role)}
				</span>
			</div>
		</div>
	);
}
