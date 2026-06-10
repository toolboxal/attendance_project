import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion";
import type { Id } from "../../../convex/_generated/dataModel";
import { RosterSlotRow, type RosterSlotRowData } from "./RosterSlotRow";
import { SectionCrowdHeader } from "./SectionCrowdHeader";
import { SectionIncludeInTotalSwitch } from "./SectionIncludeInTotalSwitch";

type LayoutSection = {
	sectionKey: string;
	name: string;
	startTime?: string;
	endTime?: string;
	headcountReporting: boolean;
	includeInTotal: boolean;
	headcount: number;
	activity: "low" | "normal" | "busy" | "overload";
	occupancyFill: "0" | "25" | "75" | "full" | "overflow";
};

type RosterSectionAccordionProps = {
	section: LayoutSection;
	slots: RosterSlotRowData[];
	canToggleIncludeInTotal: boolean;
};

export function RosterSectionAccordion({
	section,
	slots,
	canToggleIncludeInTotal,
}: RosterSectionAccordionProps) {
	const activeSlots = slots.filter((s) => s.staffStatus === "active");
	const showHeadcountInHeader = section.headcount > 0;

	return (
		<AccordionItem value={section.sectionKey} className="px-1">
			<AccordionTrigger className="hover:no-underline items-center">
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<SectionCrowdHeader
						name={section.name}
						startTime={section.startTime}
						endTime={section.endTime}
						activity={section.activity}
						headcountReporting={section.headcountReporting}
						occupancyFill={section.occupancyFill}
						headcount={showHeadcountInHeader ? section.headcount : undefined}
						activeCount={activeSlots.length}
					/>
					{showHeadcountInHeader ? (
						<SectionIncludeInTotalSwitch
							sectionId={section.sectionKey as Id<"eventSections">}
							includeInTotal={section.includeInTotal}
							canToggle={canToggleIncludeInTotal}
						/>
					) : null}
				</div>
			</AccordionTrigger>
			<AccordionContent className="space-y-2">
				{activeSlots.length === 0 ? (
					<p className="text-[11px] text-zinc-500 italic px-1">
						No active staff in this section
					</p>
				) : (
					activeSlots.map((slot) => (
						<RosterSlotRow key={slot.rowKey} slot={slot} />
					))
				)}
			</AccordionContent>
		</AccordionItem>
	);
}
