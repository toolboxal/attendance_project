import { useMutation } from "convex/react";
import { type SyntheticEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "#/components/ui/switch";
import { getStaffAccessToken } from "#/lib/staffToken";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type SectionIncludeInTotalSwitchProps = {
	sectionId: Id<"eventSections">;
	includeInTotal: boolean;
	canToggle: boolean;
	onIncludeInTotalChange?: (
		sectionId: Id<"eventSections">,
		includeInTotal: boolean,
	) => void | Promise<void>;
};

export function SectionIncludeInTotalSwitch({
	sectionId,
	includeInTotal,
	canToggle,
	onIncludeInTotalChange,
}: SectionIncludeInTotalSwitchProps) {
	const reportSectionStatus = useMutation(api.sections.reportSectionStatus);
	const [checked, setChecked] = useState(includeInTotal);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setChecked(includeInTotal);
	}, [includeInTotal]);

	const handleChange = async (next: boolean) => {
		const previous = checked;
		setChecked(next);
		setIsSaving(true);
		try {
			if (onIncludeInTotalChange) {
				await onIncludeInTotalChange(sectionId, next);
				return;
			}
			await reportSectionStatus({
				accessToken: getStaffAccessToken(),
				sectionId,
				includeInTotal: next,
			});
		} catch (err) {
			setChecked(previous);
			toast.error(err instanceof Error ? err.message : "Failed to update");
		} finally {
			setIsSaving(false);
		}
	};

	const stopAccordionToggle = (event: SyntheticEvent) => {
		event.stopPropagation();
	};

	return (
		<div className="flex shrink-0 flex-col items-end gap-0.5 pr-1">
			<span className="pointer-events-none text-[10px] text-zinc-300">
				inc total
			</span>
			<Switch
				checked={checked}
				disabled={!canToggle || isSaving}
				onCheckedChange={
					canToggle ? (value) => void handleChange(value) : undefined
				}
				onClick={stopAccordionToggle}
				onPointerDown={stopAccordionToggle}
				onKeyDown={stopAccordionToggle}
				aria-label="Include in event total"
			/>
		</div>
	);
}
