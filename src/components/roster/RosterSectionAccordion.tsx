import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion";
import type { Id } from "../../../convex/_generated/dataModel";
import { RosterSlotRow, type RosterSlotRowData } from "./RosterSlotRow";
import { SectionCrowdHeader } from "./SectionCrowdHeader";

type LayoutSection = {
	sectionKey: string;
	name: string;
	startTime?: string;
	endTime?: string;
	headcountReporting: boolean;
	includeInTotal: boolean;
	headcount: number;
	activity: "low" | "normal" | "busy" | "overload";
	occupancyFill: "0" | "25" | "50" | "75" | "90" | "full";
};

type RosterSectionAccordionProps = {
	section: LayoutSection;
	slots: RosterSlotRowData[];
	canToggleIncludeInTotal: boolean;
	onIncludeInTotalChange?: (
		sectionId: Id<"eventSections">,
		includeInTotal: boolean,
	) => void | Promise<void>;
};

export function RosterSectionAccordion({
	section,
	slots,
	canToggleIncludeInTotal,
	onIncludeInTotalChange,
}: RosterSectionAccordionProps) {
	const visibleSlots = slots.filter(
		(s) => s.staffStatus === "active" || s.staffStatus === "unclaimed",
	);
	const activeCount = slots.filter((s) => s.staffStatus === "active").length;
	const showHeadcountInHeader = section.headcount > 0;

	return (
		<AccordionItem
			value={section.sectionKey}
			className=" bg-zinc-600/60 border-b last:border-b-0 border-zinc-500"
		>
			<AccordionTrigger className="hover:no-underline items-center pr-1">
				<SectionCrowdHeader
					name={section.name}
					startTime={section.startTime}
					endTime={section.endTime}
					activity={section.activity}
					occupancyFill={section.occupancyFill}
					headcount={showHeadcountInHeader ? section.headcount : undefined}
					activeCount={activeCount}
					sectionId={section.sectionKey as Id<"eventSections">}
					includeInTotal={section.includeInTotal}
					canToggleIncludeInTotal={canToggleIncludeInTotal}
					onIncludeInTotalChange={onIncludeInTotalChange}
				/>
			</AccordionTrigger>
			<AccordionContent>
				{visibleSlots.length === 0 ? (
					<p className="text-xs text-zinc-300 italic px-1 py-2">
						No staff in this section
					</p>
				) : (
					visibleSlots.map((slot) => (
						<RosterSlotRow key={slot.rowKey} slot={slot} />
					))
				)}
			</AccordionContent>
		</AccordionItem>
	);
}
