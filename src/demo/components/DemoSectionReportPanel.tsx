import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { CollapsibleBottomPanel } from "#/components/live/CollapsibleBottomPanel";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import {
	ACTIVITY_OPTIONS,
	formatOccupancyFill,
	formatShiftRange,
	OCCUPANCY_OPTIONS,
	type SectionReportFormState,
} from "#/lib/sectionReport";
import { capitalizeWords, cn } from "#/lib/utils";

type DemoSectionReportPanelProps = {
	sectionKey: string;
	sectionName: string;
	startTime?: string;
	endTime?: string;
	serverState: SectionReportFormState;
	onSubmit: (report: SectionReportFormState) => void;
};

export function DemoSectionReportPanel({
	sectionName,
	startTime,
	endTime,
	serverState,
	onSubmit,
}: DemoSectionReportPanelProps) {
	const [form, setForm] = useState<SectionReportFormState>(serverState);
	const [headcountInput, setHeadcountInput] = useState(
		String(serverState.headcount),
	);
	const [isDirty, setIsDirty] = useState(false);
	const [isPanelOpen, setIsPanelOpen] = useState(false);

	useEffect(() => {
		if (!isDirty) {
			setForm(serverState);
			setHeadcountInput(String(serverState.headcount));
		}
	}, [serverState, isDirty]);

	const updateForm = (patch: Partial<SectionReportFormState>) => {
		setIsDirty(true);
		setForm((prev) => ({ ...prev, ...patch }));
	};

	const parseHeadcount = (value: string) => {
		if (value === "") return 0;
		const parsed = Number.parseInt(value, 10);
		return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
	};

	const commitHeadcount = (value: string) => {
		const headcount = parseHeadcount(value);
		setHeadcountInput(String(headcount));
		updateForm({ headcount });
		return headcount;
	};

	const handleHeadcountChange = (value: string) => {
		if (!/^\d*$/.test(value)) return;
		setIsDirty(true);
		setHeadcountInput(value);
		setForm((prev) => ({
			...prev,
			headcount: value === "" ? 0 : parseHeadcount(value),
		}));
	};

	const handleSubmit = () => {
		const headcount = commitHeadcount(headcountInput);
		onSubmit({
			...form,
			headcount,
		});
		setIsDirty(false);
		setIsPanelOpen(false);
	};

	const displayName = capitalizeWords(sectionName);
	const shift = formatShiftRange(startTime, endTime);

	return (
		<CollapsibleBottomPanel
			panelLabel="section report"
			open={isPanelOpen}
			onOpenChange={setIsPanelOpen}
		>
			<p className="text-sm font-medium text-zinc-300">
				Reporting for <span className="text-zinc-100">{displayName}</span>
				{shift ? (
					<span className="ml-1.5 text-xs font-mono text-yellow-200">
						{shift}
					</span>
				) : null}
			</p>

			<div className="space-y-1.5">
				<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
					<p className="text-[11px] text-zinc-300">
						Only if relevant to your section
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
						<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
						<p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
							Headcount
						</p>
						<Input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={headcountInput}
							onChange={(e) => handleHeadcountChange(e.target.value)}
							onBlur={() => commitHeadcount(headcountInput)}
							className="w-24 text-center text-sm font-bold"
							aria-label="Headcount"
						/>
					</div>
				</>
			) : null}

			<button
				type="button"
				disabled={!isDirty}
				onClick={handleSubmit}
				className={cn(
					"flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all mt-1",
					!isDirty
						? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
						: "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 active:scale-[0.98]",
				)}
			>
				<Send className="size-4" />
				Submit report
			</button>
		</CollapsibleBottomPanel>
	);
}
