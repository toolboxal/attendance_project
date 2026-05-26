import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isEventAccessClosed } from "./events";

export type LiveContext = {
	staff: Doc<"liveStaff">;
	event: Doc<"events">;
	isAdmin: boolean;
	isSupervisor: boolean;
};

export async function getLiveContext(
	ctx: QueryCtx | MutationCtx,
	accessToken: string,
): Promise<LiveContext | null> {
	const staff = await ctx.db
		.query("liveStaff")
		.withIndex("by_accessToken", (q) => q.eq("accessToken", accessToken))
		.first();

	if (!staff || staff.status === "checked_out") {
		return null;
	}

	const event = await ctx.db.get(staff.eventId);
	if (!event || event.status !== "live" || isEventAccessClosed(event)) {
		return null;
	}

	const isAdmin = staff.adminUserId != null;
	const isSupervisor = staff.role === "supervisor" || isAdmin;

	return { staff, event, isAdmin, isSupervisor };
}

export function requireAdmin(live: LiveContext) {
	if (!live.isAdmin) {
		throw new Error("Admin only");
	}
}

export function requireSupervisor(live: LiveContext) {
	if (!live.isSupervisor) {
		throw new Error("Supervisor only");
	}
}
