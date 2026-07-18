import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { tv } from "tailwind-variants";
import { StaffManagementPanel } from "#/components/admin/StaffManagementPanel";
import { Spinner } from "#/components/ui/spinner";
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

export const Route = createFileRoute("/live/_dashboard/assign")({
	component: AssignTabComponent,
});

function AssignTabComponent() {
	const { container, scroll } = layoutStyles();
	const accessToken = getStaffAccessToken();

	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, { accessToken }),
	);

	if (!profile?.isSupervisor) {
		return <Navigate to="/live/jobs" replace />;
	}

	if (profile.isAdmin) {
		return <Navigate to="/live/admin" replace />;
	}

	return (
		<div className={container()}>
			<div className={scroll()}>
				<Suspense
					fallback={
						<div className="flex justify-center py-12">
							<Spinner className="size-6 text-zinc-500" />
						</div>
					}
				>
					<StaffManagementPanel description="Assign staff roles and share invites. Supervisor roles stay with the event admin." />
				</Suspense>
			</div>
		</div>
	);
}
