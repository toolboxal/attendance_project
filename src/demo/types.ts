import type { OccupancyFill } from "#/lib/sectionReport";
import type { RosterSlotRowData } from "#/components/roster/RosterSlotRow";

export type DemoJobStatus = "pending" | "accepted" | "resolved";
export type DemoAlertStatus = "open" | "resolved";
export type DemoActivity = "low" | "normal" | "busy" | "overload";

export type DemoProfile = {
	id: string;
	name: string;
	role: string;
	roleTitle: string;
	sectionName: string;
	sectionId: string;
	isSupervisor: boolean;
	eventDate: string;
	sectionStartTime: string;
	sectionEndTime: string;
};

export type DemoJob = {
	id: string;
	creatorId: string;
	claimerId?: string;
	personCount: number;
	requestType: string;
	description?: string;
	status: DemoJobStatus;
	creatorName: string;
	creatorRole?: string;
	creatorRoleTitle: string;
	claimerName?: string;
	claimerRole?: string;
	claimerRoleTitle: string;
	originSectionName: string;
	destinationSectionName?: string;
	creatorMissing: boolean;
	claimerMissing: boolean;
};

export type DemoAlertUpdate = {
	id: string;
	authorId: string;
	authorName: string;
	authorRole?: string;
	content: string;
	createdAt: number;
};

export type DemoAlert = {
	id: string;
	creatorId: string;
	creatorName: string;
	creatorRole?: string;
	creatorRoleTitle: string;
	sectionName?: string;
	alertType: string;
	body: string;
	status: DemoAlertStatus;
	isPinned: boolean;
	createdAt: number;
	updates: DemoAlertUpdate[];
};

export type DemoRosterSection = {
	sectionKey: string;
	name: string;
	startTime: string;
	endTime: string;
	headcountReporting: boolean;
	includeInTotal: boolean;
	headcount: number;
	activity: DemoActivity;
	occupancyFill: OccupancyFill;
	slots: RosterSlotRowData[];
};

export type DemoFloorState = {
	profile: DemoProfile;
	jobs: DemoJob[];
	alerts: DemoAlert[];
	sections: DemoRosterSection[];
};

export type DemoTab = "jobs" | "alert" | "roster";
