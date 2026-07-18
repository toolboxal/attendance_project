import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import { formatTime12h } from "#/lib/utils";

export function DemoAssignTab() {
	const { state, assignStaffSlot, revokeStaffSlot } = useDemoFloor();
	const [assigning, setAssigning] = useState<{
		sectionKey: string;
		rowKey: string;
		title: string;
	} | null>(null);
	const [name, setName] = useState("");

	const staffSections = useMemo(
		() =>
			state.sections
				.map((section) => ({
					...section,
					slots: section.slots.filter((slot) => slot.role === "staff"),
				}))
				.filter((section) => section.slots.length > 0),
		[state.sections],
	);

	const handleAssign = () => {
		if (!assigning || !name.trim()) return;
		assignStaffSlot(assigning.sectionKey, assigning.rowKey, name.trim());
		setAssigning(null);
		setName("");
	};

	return (
		<div className="h-[calc(100dvh-5.5rem)] flex flex-col bg-zinc-950 overflow-hidden">
			<div className="flex-1 overflow-y-auto py-2 px-1 pb-36 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				<div className="px-1">
					<p className="text-md font-bold text-zinc-50">Staff Management</p>
					<p className="text-xs text-zinc-300">
						Assign staff roles and revoke access. Supervisor roles stay with the
						event admin.
					</p>
				</div>

				{staffSections.map((section) => (
					<div key={section.sectionKey} className="space-y-1">
						<div className="px-0.5 flex items-center gap-2 flex-row">
							<p className="text-[11px] font-bold uppercase text-zinc-400">
								{section.name}
							</p>
							{section.startTime && section.endTime ? (
								<p className="text-[11px] font-mono font-bold text-yellow-200">
									{formatTime12h(section.startTime)} –{" "}
									{formatTime12h(section.endTime)}
								</p>
							) : null}
						</div>
						<div className="rounded-lg bg-zinc-800/40 px-2.5">
							{section.slots.map((slot) => {
								const vacant = !slot.assignedStaffId;
								const statusLabel = vacant
									? "Unassigned"
									: slot.staffStatus === "unclaimed"
										? "Pending"
										: "Active";
								return (
									<div
										key={slot.rowKey}
										className="flex items-center gap-2 py-2 border-b border-zinc-800 last:border-0"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-zinc-200 truncate font-medium">
												{slot.title}
											</p>
											<p className="text-[10px] font-medium text-zinc-400">
												STAFF
												{slot.staffName ? ` · ${slot.staffName}` : ""} ·{" "}
												<span
													className={`${
														statusLabel === "Active"
															? "text-green-500"
															: statusLabel === "Pending"
																? "text-yellow-500"
																: "text-zinc-300"
													} font-semibold`}
												>
													{statusLabel}
												</span>
											</p>
										</div>
										{vacant ? (
											<Button
												type="button"
												variant="link"
												size="sm"
												onClick={() =>
													setAssigning({
														sectionKey: section.sectionKey,
														rowKey: slot.rowKey,
														title: slot.title,
													})
												}
											>
												Assign
											</Button>
										) : (
											<Button
												type="button"
												variant="link"
												size="sm"
												className="text-red-400"
												onClick={() =>
													revokeStaffSlot(section.sectionKey, slot.rowKey)
												}
											>
												Revoke
											</Button>
										)}
									</div>
								);
							})}
						</div>
					</div>
				))}

				{assigning ? (
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-3">
						<p className="text-sm font-medium text-zinc-100">
							Assign {assigning.title}
						</p>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Alexis Chen"
							className="bg-zinc-950 border-zinc-800 text-zinc-100"
						/>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="ghost"
								className="flex-1"
								onClick={() => {
									setAssigning(null);
									setName("");
								}}
							>
								Cancel
							</Button>
							<Button
								type="button"
								className="flex-1"
								disabled={!name.trim()}
								onClick={handleAssign}
							>
								Assign
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
