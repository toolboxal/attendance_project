export const ACTIVITY_OPTIONS = [
	{
		value: "low",
		label: "Low",
		badgeClass: "text-sky-400 ",
		selectedClass: "bg-sky-400 text-sky-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-sky-400/20",
	},
	{
		value: "normal",
		label: "Normal",
		badgeClass: "text-emerald-400 ",
		selectedClass: "bg-emerald-400 text-emerald-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-emerald-400/20",
	},
	{
		value: "busy",
		label: "Busy",
		badgeClass: "text-yellow-400 ",
		selectedClass: "bg-yellow-400 text-yellow-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-yellow-400/20",
	},
	{
		value: "overload",
		label: "Overload",
		badgeClass: "text-red-400 ",
		selectedClass: "bg-red-400 text-red-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-red-400/20",
	},
] as const;

export type Activity = (typeof ACTIVITY_OPTIONS)[number]["value"];

export type OccupancyFill = "0" | "25" | "50" | "75" | "90" | "full";

export const OCCUPANCY_OPTIONS: OccupancyFill[] = [
	"0",
	"25",
	"50",
	"75",
	"90",
	"full",
];

const ACTIVITY_BY_VALUE = Object.fromEntries(
	ACTIVITY_OPTIONS.map((option) => [option.value, option]),
) as Record<Activity, (typeof ACTIVITY_OPTIONS)[number]>;

export function getActivityOption(value: Activity) {
	return ACTIVITY_BY_VALUE[value];
}

export function normalizeOccupancyFill(value: string): OccupancyFill {
	if (value === "overflow") return "50";
	if (
		value === "0" ||
		value === "25" ||
		value === "50" ||
		value === "75" ||
		value === "90" ||
		value === "full"
	) {
		return value;
	}
	return "0";
}

export function formatOccupancyFill(value: OccupancyFill): string {
	if (value === "full") return "Full";
	return `${value}%`;
}

const OCCUPANCY_FILL_VISUAL: Record<
	OccupancyFill,
	{ fillPercent: number; fillClass: string; labelClass: string }
> = {
	"0": {
		fillPercent: 0,
		fillClass: "bg-zinc-500",
		labelClass: "text-zinc-300",
	},
	"25": {
		fillPercent: 25,
		fillClass: "bg-sky-700",
		labelClass: "text-sky-400",
	},
	"50": {
		fillPercent: 50,
		fillClass: "bg-emerald-700",
		labelClass: "text-emerald-400",
	},
	"75": {
		fillPercent: 75,
		fillClass: "bg-yellow-700",
		labelClass: "text-yellow-400",
	},
	"90": {
		fillPercent: 90,
		fillClass: "bg-orange-700",
		labelClass: "text-orange-400",
	},
	full: {
		fillPercent: 100,
		fillClass: "bg-red-800",
		labelClass: "text-red-500",
	},
};

export function getOccupancyFillVisual(value: OccupancyFill | string) {
	const normalized = normalizeOccupancyFill(value);
	const visual = OCCUPANCY_FILL_VISUAL[normalized];
	return {
		...visual,
		label: formatOccupancyFill(normalized),
	};
}

export function formatShiftRange(startTime?: string, endTime?: string): string {
	if (!startTime || !endTime) return "";
	return `${startTime}–${endTime}`;
}
