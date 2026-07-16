import { tv } from "tailwind-variants";
import { PhoneMockupShell } from "#/components/public/landing/LiveFloorPreviewChrome";
import { RosterSectionAccordion } from "#/components/roster/RosterSectionAccordion";
import type { RosterSlotRowData } from "#/components/roster/RosterSlotRow";
import { SectionHeadcountBreakdown } from "#/components/roster/SectionHeadcountBreakdown";
import type { OccupancyFill } from "#/lib/sectionReport";
import { Accordion } from "#/components/ui/accordion";
import type { Id } from "../../../../convex/_generated/dataModel";

type MockRosterSection = {
	sectionKey: string;
	name: string;
	startTime: string;
	endTime: string;
	headcountReporting: boolean;
	includeInTotal: boolean;
	headcount: number;
	activity: "low" | "normal" | "busy" | "overload";
	occupancyFill: OccupancyFill;
	slots: RosterSlotRowData[];
};

const MOCK_ROSTER_SECTIONS: MockRosterSection[] = [
	{
		sectionKey: "section-main-hall",
		name: "main hall",
		startTime: "09:00",
		endTime: "17:00",
		headcountReporting: true,
		includeInTotal: true,
		headcount: 420,
		activity: "busy",
		occupancyFill: "75",
		slots: [
			{
				rowKey: "mh-1",
				title: "Floor Coordinator",
				role: "supervisor",
				assignedStaffId: "mock_staff_jon" as Id<"liveStaff">,
				staffName: "Toby Scott",
				staffStatus: "active",
				isViewer: true,
			},
			{
				rowKey: "mh-2",
				title: "Usher Lead",
				role: "staff",
				assignedStaffId: "mock_staff_maria" as Id<"liveStaff">,
				staffName: "Maria Santos",
				staffStatus: "active",
				isViewer: false,
			},
			{
				rowKey: "mh-3",
				title: "Door Attendant",
				role: "staff",
				assignedStaffId: "mock_staff_priya" as Id<"liveStaff">,
				staffName: "Priya Nair",
				staffStatus: "active",
				isViewer: false,
			},
		],
	},
	{
		sectionKey: "section-gate-a",
		name: "gate a",
		startTime: "08:30",
		endTime: "16:30",
		headcountReporting: true,
		includeInTotal: true,
		headcount: 280,
		activity: "overload",
		occupancyFill: "90",
		slots: [
			{
				rowKey: "ga-1",
				title: "Gate Supervisor",
				role: "supervisor",
				assignedStaffId: "mock_staff_james" as Id<"liveStaff">,
				staffName: "James Wu",
				staffStatus: "active",
				isViewer: false,
			},
			{
				rowKey: "ga-2",
				title: "Queue Usher",
				role: "staff",
				assignedStaffId: "mock_staff_david" as Id<"liveStaff">,
				staffName: "David Park",
				staffStatus: "active",
				isViewer: false,
			},
		],
	},
	{
		sectionKey: "section-vip",
		name: "vip lounge",
		startTime: "10:00",
		endTime: "14:00",
		headcountReporting: true,
		includeInTotal: true,
		headcount: 85,
		activity: "normal",
		occupancyFill: "50",
		slots: [
			{
				rowKey: "vip-1",
				title: "VIP Host",
				role: "supervisor",
				assignedStaffId: "mock_staff_elena" as Id<"liveStaff">,
				staffName: "Elena Reyes",
				staffStatus: "active",
				isViewer: false,
			},
			{
				rowKey: "vip-2",
				title: "Guest Liaison",
				role: "staff",
				assignedStaffId: "mock_staff_tom" as Id<"liveStaff">,
				staffName: "Tom Bradley",
				staffStatus: "unclaimed",
				isViewer: false,
			},
		],
	},
	{
		sectionKey: "section-lobby",
		name: "lobby",
		startTime: "09:00",
		endTime: "18:00",
		headcountReporting: true,
		includeInTotal: false,
		headcount: 0,
		activity: "low",
		occupancyFill: "25",
		slots: [
			{
				rowKey: "lb-1",
				title: "Lobby Lead",
				role: "supervisor",
				assignedStaffId: "mock_staff_sara" as Id<"liveStaff">,
				staffName: "Sara Kim",
				staffStatus: "active",
				isViewer: false,
			},
			{
				rowKey: "lb-2",
				title: "Info Desk",
				role: "staff",
				assignedStaffId: "mock_staff_alex" as Id<"liveStaff">,
				staffName: "Alex Chen",
				staffStatus: "active",
				isViewer: false,
			},
			{
				rowKey: "lb-3",
				title: "Greeter",
				role: "staff",
				assignedStaffId: "mock_staff_nina" as Id<"liveStaff">,
				staffName: "Nina Ortiz",
				staffStatus: "active",
				isViewer: false,
			},
		],
	},
	{
		sectionKey: "section-parking",
		name: "parking",
		startTime: "08:00",
		endTime: "19:00",
		headcountReporting: false,
		includeInTotal: false,
		headcount: 0,
		activity: "normal",
		occupancyFill: "0",
		slots: [
			{
				rowKey: "pk-1",
				title: "Parking Lead",
				role: "supervisor",
				assignedStaffId: "mock_staff_chris" as Id<"liveStaff">,
				staffName: "Chris Lee",
				staffStatus: "active",
				isViewer: false,
			},
			{
				rowKey: "pk-2",
				title: "Valet Coordinator",
				role: "staff",
				assignedStaffId: "mock_staff_jordan" as Id<"liveStaff">,
				staffName: "Jordan Mills",
				staffStatus: "checked_out",
				isViewer: false,
			},
		],
	},
];

const ROSTER_BREAKDOWN = MOCK_ROSTER_SECTIONS.filter(
	(section) => section.includeInTotal && section.headcount > 0,
).map((section) => ({
	sectionKey: section.sectionKey,
	name: section.name,
	headcount: section.headcount,
	occupancyFill: section.occupancyFill,
}));

const TOTAL_HEADCOUNT = ROSTER_BREAKDOWN.reduce(
	(sum, section) => sum + section.headcount,
	0,
);

const layoutStyles = tv({
	slots: {
		rosterContainer: "flex-1 overflow-hidden py-2 px-0.5 pb-2 min-h-0",
	},
});

export function RosterPreview() {
	const { rosterContainer } = layoutStyles();
	const expandedSections = MOCK_ROSTER_SECTIONS.map(
		(section) => section.sectionKey,
	);

	return (
		<section className="spine py-16 md:py-24">
			<div className="flex flex-col md:flex-row gap-10 md:gap-12 items-start px-2 md:px-10">
				<div className="flex-1 max-w-xl text-left mt-8">
					<h2 className="text-3xl md:text-4xl font-heading text-zinc-100 tracking-tight leading-tight">
						See every section on the event roster
					</h2>
					<p className="text-lg text-zinc-400 pt-4 font-light leading-relaxed">
						Activity levels, occupancy, and headcount — updated live from the
						floor.
					</p>
				</div>
				<PhoneMockupShell heightClass="h-[480px]">
					<div className="flex flex-row gap-5 px-1 pb-2 shrink-0 pointer-events-none">
						<div className="flex flex-col px-1">
							<span className="text-[10px] text-zinc-300 text-nowrap">
								Total Headcount
							</span>
							<div className="flex flex-row items-center gap-1">
								<span className="text-2xl font-bold text-emerald-200">
									{TOTAL_HEADCOUNT.toLocaleString()}
								</span>
								<span className="text-zinc-400 text-sm">pax</span>
							</div>
						</div>
						<SectionHeadcountBreakdown sections={ROSTER_BREAKDOWN} />
					</div>

					<div className="shrink-0 flex px-1 pb-1">
						<div className="flex items-center gap-1.5 text-sm font-mono font-bold text-zinc-400">
							<span>Event ends in</span>
							<span>18:42:15</span>
						</div>
					</div>

					<div className="relative flex-1 min-h-0 overflow-hidden">
						<div className={rosterContainer()}>
							<Accordion
								type="multiple"
								defaultValue={expandedSections}
								className="w-full pointer-events-none"
							>
								{MOCK_ROSTER_SECTIONS.map((section) => (
									<RosterSectionAccordion
										key={section.sectionKey}
										section={section}
										slots={section.slots}
										canToggleIncludeInTotal={false}
									/>
								))}
							</Accordion>
						</div>
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10" />
					</div>
				</PhoneMockupShell>
			</div>
		</section>
	);
}
