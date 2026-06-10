import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getLiveContext, requireSupervisor } from "./liveAuth";
import { FLOATING_SECTION_KEY, UNASSIGNED_SECTION_KEY } from "./constants";
const FLOATING_KEY = FLOATING_SECTION_KEY;
const UNASSIGNED_KEY = UNASSIGNED_SECTION_KEY;

const occupancyFillValidator = v.union(
	v.literal("0"),
	v.literal("25"),
	v.literal("75"),
	v.literal("full"),
	v.literal("overflow"),
);

const activityValidator = v.union(
	v.literal("low"),
	v.literal("normal"),
	v.literal("busy"),
	v.literal("overload"),
);

export type SlotRow = {
	rowKey: string;
	slotId?: Id<"roleSlots">;
	title: string;
	role: "supervisor" | "staff";
	description?: string;
	assignedStaffId?: Id<"liveStaff">;
	staffName?: string;
	staffStatus?: "unclaimed" | "active" | "checked_out";
	isViewer: boolean;
};

function compareSlots(a: SlotRow, b: SlotRow): number {
	const roleOrder = (r: "supervisor" | "staff") => (r === "supervisor" ? 0 : 1);
	const byRole = roleOrder(a.role) - roleOrder(b.role);
	if (byRole !== 0) return byRole;
	return a.title.localeCompare(b.title);
}

function buildSlotRow(
	slot: Doc<"roleSlots">,
	staff: Doc<"liveStaff"> | null,
	viewerStaffId: Id<"liveStaff">,
): SlotRow {
	return {
		rowKey: slot._id,
		slotId: slot._id,
		title: slot.title,
		role: slot.role,
		description: slot.description,
		assignedStaffId: slot.assignedStaffId,
		staffName: staff?.staffName,
		staffStatus: staff?.status,
		isViewer: slot.assignedStaffId === viewerStaffId,
	};
}

function buildOrphanRow(
	staff: Doc<"liveStaff">,
	viewerStaffId: Id<"liveStaff">,
): SlotRow {
	return {
		rowKey: `orphan:${staff._id}`,
		title: "Unassigned slot",
		role: staff.role,
		assignedStaffId: staff._id,
		staffName: staff.staffName,
		staffStatus: staff.status,
		isViewer: staff._id === viewerStaffId,
	};
}

async function requireSectionAssignment(
	ctx: Parameters<typeof getLiveContext>[0],
	eventId: Id<"events">,
	sectionId: Id<"eventSections">,
	staffId: Id<"liveStaff">,
) {
	const slot = await ctx.db
		.query("roleSlots")
		.withIndex("by_event", (q) => q.eq("eventId", eventId))
		.filter((q) =>
			q.and(
				q.eq(q.field("sectionId"), sectionId),
				q.eq(q.field("assignedStaffId"), staffId),
			),
		)
		.first();

	if (!slot) {
		throw new Error("Not assigned to this section");
	}
}

export const getRosterLayout = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return null;

		const { staff: viewer, event } = live;
		const eventId = event._id;

		const [slots, sections] = await Promise.all([
			ctx.db
				.query("roleSlots")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
			ctx.db
				.query("eventSections")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		]);

		const sectionKeysWithSlots = new Set<string>();
		for (const slot of slots) {
			sectionKeysWithSlots.add(slot.sectionId ?? FLOATING_KEY);
		}

		const layoutSections: Array<{
			sectionKey: string;
			name: string;
			startTime?: string;
			endTime?: string;
			headcountReporting: boolean;
			includeInTotal: boolean;
			headcount: number;
			activity: Doc<"eventSections">["activity"];
			occupancyFill: Doc<"eventSections">["occupancyFill"];
		}> = [];

		const namedSections = sections
			.filter((s) => sectionKeysWithSlots.has(s._id))
			.sort((a, b) => a.name.localeCompare(b.name));

		for (const section of namedSections) {
			layoutSections.push({
				sectionKey: section._id,
				name: section.name,
				startTime: section.startTime,
				endTime: section.endTime,
				headcountReporting: section.headcountReporting,
				includeInTotal: section.includeInTotal,
				headcount: section.headcount,
				activity: section.activity,
				occupancyFill: section.occupancyFill,
			});
		}

		if (sectionKeysWithSlots.has(FLOATING_KEY)) {
			layoutSections.push({
				sectionKey: FLOATING_KEY,
				name: "Floating",
				headcountReporting: false,
				includeInTotal: false,
				headcount: 0,
				activity: "normal",
				occupancyFill: "0",
			});
		}

		if (sectionKeysWithSlots.has(UNASSIGNED_KEY)) {
			layoutSections.push({
				sectionKey: UNASSIGNED_KEY,
				name: "Unassigned",
				headcountReporting: false,
				includeInTotal: false,
				headcount: 0,
				activity: "normal",
				occupancyFill: "0",
			});
		}

		return {
			sections: layoutSections,
			viewerStaffId: viewer._id,
		};
	},
});

export const getRosterStaff = query({
	args: { accessToken: v.string() },
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return null;

		const { staff: viewer, event } = live;
		const eventId = event._id;

		const [slots, allStaff] = await Promise.all([
			ctx.db
				.query("roleSlots")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
			ctx.db
				.query("liveStaff")
				.withIndex("by_event", (q) => q.eq("eventId", eventId))
				.collect(),
		]);

		const staffById = new Map(
			allStaff
				.filter((s) => s.adminUserId == null)
				.map((s) => [s._id, s] as const),
		);

		const slotsBySectionKey = new Map<string, SlotRow[]>();

		const addToSection = (key: string, row: SlotRow) => {
			const list = slotsBySectionKey.get(key) ?? [];
			list.push(row);
			slotsBySectionKey.set(key, list);
		};

		for (const slot of slots) {
			const occupant = slot.assignedStaffId
				? (staffById.get(slot.assignedStaffId) ?? null)
				: null;
			const row = buildSlotRow(slot, occupant, viewer._id);
			addToSection(slot.sectionId ?? FLOATING_KEY, row);
		}

		const assignedStaffIds = new Set(
			slots
				.map((s) => s.assignedStaffId)
				.filter((id): id is Id<"liveStaff"> => id != null),
		);

		const orphanActive = allStaff.filter(
			(s) =>
				s.adminUserId == null &&
				s.status === "active" &&
				!assignedStaffIds.has(s._id),
		);

		for (const orphan of orphanActive) {
			addToSection(UNASSIGNED_KEY, buildOrphanRow(orphan, viewer._id));
		}

		for (const [key, sectionSlots] of slotsBySectionKey) {
			if (key === UNASSIGNED_KEY) {
				sectionSlots.sort((a, b) =>
					(a.staffName ?? "").localeCompare(b.staffName ?? ""),
				);
			} else {
				sectionSlots.sort(compareSlots);
			}
		}

		const staffBySection: Record<string, SlotRow[]> = {};
		for (const [key, sectionSlots] of slotsBySectionKey) {
			staffBySection[key] = sectionSlots;
		}

		return {
			staffBySection,
			viewerStaffId: viewer._id,
		};
	},
});

export const getSectionReport = query({
	args: {
		accessToken: v.string(),
		sectionId: v.id("eventSections"),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) return null;

		const section = await ctx.db.get(args.sectionId);
		if (!section || section.eventId !== live.event._id) return null;

		const lastReporter = section.lastUpdatedBy
			? await ctx.db.get(section.lastUpdatedBy)
			: null;

		return {
			activity: section.activity,
			occupancyFill: section.occupancyFill,
			headcount: section.headcount,
			headcountReporting: section.headcountReporting,
			includeInTotal: section.includeInTotal,
			lastUpdatedAt: section.lastUpdatedAt,
			lastUpdatedByName: lastReporter?.staffName,
		};
	},
});

export const reportSectionStatus = mutation({
	args: {
		accessToken: v.string(),
		sectionId: v.id("eventSections"),
		activity: v.optional(activityValidator),
		headcountReporting: v.optional(v.boolean()),
		occupancyFill: v.optional(occupancyFillValidator),
		headcount: v.optional(v.number()),
		includeInTotal: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const live = await getLiveContext(ctx, args.accessToken);
		if (!live) throw new Error("Unauthorized");

		const section = await ctx.db.get(args.sectionId);
		if (!section || section.eventId !== live.event._id) {
			throw new Error("Section not found");
		}

		const updatingIncludeInTotal = args.includeInTotal !== undefined;
		const updatingSectionReport =
			args.activity !== undefined ||
			args.headcountReporting !== undefined ||
			args.occupancyFill !== undefined ||
			args.headcount !== undefined;

		if (updatingSectionReport) {
			await requireSectionAssignment(
				ctx,
				live.event._id,
				args.sectionId,
				live.staff._id,
			);
		}

		if (updatingIncludeInTotal) {
			requireSupervisor(live);
		}

		const patch: Partial<Doc<"eventSections">> & {
			lastUpdatedAt: number;
			lastUpdatedBy: Id<"liveStaff">;
		} = {
			lastUpdatedAt: Date.now(),
			lastUpdatedBy: live.staff._id,
		};

		if (args.activity !== undefined) patch.activity = args.activity;
		if (args.headcountReporting !== undefined) {
			patch.headcountReporting = args.headcountReporting;
			if (!args.headcountReporting) {
				patch.includeInTotal = false;
			}
		}

		const reportingAfter =
			args.headcountReporting ?? section.headcountReporting;

		if (
			args.occupancyFill !== undefined ||
			args.headcount !== undefined
		) {
			if (!reportingAfter) {
				throw new Error("Enable headcount reporting first");
			}
		}

		if (args.occupancyFill !== undefined) {
			patch.occupancyFill = args.occupancyFill;
		}
		if (args.headcount !== undefined) {
			if (!Number.isInteger(args.headcount) || args.headcount < 0) {
				throw new Error("Headcount must be a non-negative whole number");
			}
			patch.headcount = args.headcount;
		}
		if (args.includeInTotal !== undefined) {
			patch.includeInTotal = args.includeInTotal;
		}

		await ctx.db.patch(args.sectionId, patch);
	},
});
