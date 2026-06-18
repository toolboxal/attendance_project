import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { tv } from "tailwind-variants";
import { AdminBroadcastSection } from "#/components/admin/AdminBroadcastSection";
import { AdminEventControls } from "#/components/admin/AdminEventControls";
import { AdminOperationalPost } from "#/components/admin/AdminOperationalPost";
import { AdminStaffManagement } from "#/components/admin/AdminStaffManagement";
import { getStaffAccessToken } from "#/lib/staffToken";
import { api } from "../../../../convex/_generated/api";

const layoutStyles = tv({
	slots: {
		container:
			"flex flex-col h-[calc(100dvh-5.5rem)] bg-zinc-950 overflow-hidden",
		scroll:
			"flex-1 overflow-y-auto py-2 px-1 pb-4 min-h-0 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
	},
});

export const Route = createFileRoute("/live/_dashboard/admin")({
	component: AdminTabComponent,
});

function AdminTabComponent() {
	const { container, scroll } = layoutStyles();
	const accessToken = getStaffAccessToken();

	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, { accessToken }),
	);

	if (!profile?.isAdmin) {
		return <Navigate to="/live/jobs" replace />;
	}

	return (
		<div className={container()}>
			<div className={scroll()}>
				<AdminEventControls />
				<div className="h-px bg-zinc-700 my-4" />
				<AdminOperationalPost />

				<div className="h-px bg-zinc-700 my-4" />
				<AdminBroadcastSection accessToken={accessToken} />
				<div className="h-px bg-zinc-700 my-4" />
				<AdminStaffManagement />
			</div>
		</div>
	);
}
