import { useMutation } from "convex/react";
import { Minus, Plus, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CollapsibleBottomPanel } from "#/components/live/CollapsibleBottomPanel";
import { Switch } from "#/components/ui/switch";
import {
	ACTIVITY_OPTIONS,
	type Activity,
	formatOccupancyFill,
	formatShiftRange,
	OCCUPANCY_OPTIONS,
	type OccupancyFill,
} from "#/lib/sectionReport";
import { getStaffAccessToken } from "#/lib/staffToken";
import { capitalizeWords, cn } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export type SectionReportFormState = {
	activity: Activity;
	headcountReporting: boolean;
	occupancyFill: OccupancyFill;
	headcount: number;
};

type SectionReportPanelProps = {
	sectionId: Id<"eventSections">;
	sectionName: string;
	startTime?: string;
	endTime?: string;
	serverState: SectionReportFormState;
};

export function SectionReportPanel({
	sectionId,
	sectionName,
	startTime,
	endTime,
	serverState,
}: SectionReportPanelProps) {
	const reportSectionStatus = useMutation(api.sections.reportSectionStatus);
	const [form, setForm] = useState<SectionReportFormState>(serverState);
	const [isDirty, setIsDirty] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isDirty) {
			setForm(serverState);
		}
	}, [serverState, isDirty]);

	const updateForm = (patch: Partial<SectionReportFormState>) => {
		setIsDirty(true);
		setForm((prev) => ({ ...prev, ...patch }));
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			await reportSectionStatus({
				accessToken: getStaffAccessToken(),
				sectionId,
				activity: form.activity,
				headcountReporting: form.headcountReporting,
				...(form.headcountReporting
					? {
							occupancyFill: form.occupancyFill,
							headcount: form.headcount,
						}
					: {}),
			});
			setIsDirty(false);
			toast.success("Section report updated");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save");
		} finally {
			setIsSubmitting(false);
		}
	};

	const displayName = capitalizeWords(sectionName);

	const shift = formatShiftRange(startTime, endTime);

	return (
		<CollapsibleBottomPanel panelLabel="section report">
			<p className="text-sm font-medium text-zinc-300">
				Reporting for <span className="text-zinc-100">{displayName}</span>
				{shift ? (
					<span className="ml-1.5 text-xs font-mono text-yellow-200">
						{shift}
					</span>
				) : null}
			</p>

			<div className="space-y-1.5">
				<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
					Activity
				</p>
				<div className="flex flex-wrap gap-1.5">
					{ACTIVITY_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => updateForm({ activity: option.value })}
							className={cn(
								"px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors",
								form.activity === option.value
									? option.selectedClass
									: option.unselectedClass,
							)}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex items-center justify-between gap-2">
				<div>
					<p className="text-xs font-medium text-zinc-200">Report headcount</p>
					<p className="text-[10px] text-zinc-500">
						Enable crowd count and occupancy
					</p>
				</div>
				<Switch
					checked={form.headcountReporting}
					onCheckedChange={(checked) =>
						updateForm({ headcountReporting: checked })
					}
				/>
			</div>

			{form.headcountReporting ? (
				<>
					<div className="space-y-1.5">
						<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
							Occupancy
						</p>
						<div className="flex flex-wrap gap-1.5">
							{OCCUPANCY_OPTIONS.map((option) => (
								<button
									key={option}
									type="button"
									onClick={() => updateForm({ occupancyFill: option })}
									className={cn(
										"px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors",
										form.occupancyFill === option
											? "bg-zinc-200 text-zinc-950"
											: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
									)}
								>
									{formatOccupancyFill(option)}
								</button>
							))}
						</div>
					</div>

					<div className="flex items-center justify-between gap-2">
						<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
							Headcount
						</p>
						<div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/50 overflow-hidden">
							<button
								type="button"
								disabled={form.headcount <= 0}
								onClick={() =>
									updateForm({ headcount: Math.max(0, form.headcount - 1) })
								}
								className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-100"
							>
								<Minus className="size-3.5" />
							</button>
							<span className="min-w-10 text-center text-sm font-bold text-zinc-100">
								{form.headcount}
							</span>
							<button
								type="button"
								onClick={() => updateForm({ headcount: form.headcount + 1 })}
								className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-100"
							>
								<Plus className="size-3.5" />
							</button>
						</div>
					</div>
				</>
			) : null}

			<button
				type="button"
				disabled={!isDirty || isSubmitting}
				onClick={() => void handleSubmit()}
				className={cn(
					"flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
					!isDirty || isSubmitting
						? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
						: "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 active:scale-[0.98]",
				)}
			>
				<Send className="size-4" />
				{isSubmitting ? "Saving…" : "Submit report"}
			</button>
		</CollapsibleBottomPanel>
	);
}
