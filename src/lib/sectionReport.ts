export const ACTIVITY_OPTIONS = [
	{
		value: "low",
		label: "Low",
		badgeClass: "text-sky-400 bg-sky-400/10",
		selectedClass: "bg-sky-400 text-sky-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-sky-400/20",
	},
	{
		value: "normal",
		label: "Normal",
		badgeClass: "text-green-400 bg-green-400/10",
		selectedClass: "bg-green-400 text-green-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-green-400/20",
	},
	{
		value: "busy",
		label: "Busy",
		badgeClass: "text-yellow-400 bg-yellow-400/10",
		selectedClass: "bg-yellow-400 text-yellow-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-yellow-400/20",
	},
	{
		value: "overload",
		label: "Overload",
		badgeClass: "text-red-400 bg-red-400/10",
		selectedClass: "bg-red-400 text-red-950",
		unselectedClass: "bg-zinc-800 text-zinc-50 hover:bg-red-400/20",
	},
] as const;

export type Activity = (typeof ACTIVITY_OPTIONS)[number]["value"];

export type OccupancyFill = "0" | "25" | "75" | "full" | "overflow";

export const OCCUPANCY_OPTIONS: OccupancyFill[] = [
	"0",
	"25",
	"75",
	"full",
	"overflow",
];

const ACTIVITY_BY_VALUE = Object.fromEntries(
	ACTIVITY_OPTIONS.map((option) => [option.value, option]),
) as Record<Activity, (typeof ACTIVITY_OPTIONS)[number]>;

export function getActivityOption(value: Activity) {
	return ACTIVITY_BY_VALUE[value];
}

export function formatOccupancyFill(value: OccupancyFill): string {
	if (value === "full") return "Full";
	if (value === "overflow") return "Overflow";
	return `${value}%`;
}

export function formatShiftRange(startTime?: string, endTime?: string): string {
	if (!startTime || !endTime) return "";
	return `${startTime}–${endTime}`;
}
