import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import {
	clearStaffAccessToken,
	getStaffAccessToken,
} from "#/lib/staffToken";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/live/ended")({
	component: EventEndedComponent,
});

function EventEndedComponent() {
	const navigate = useNavigate();
	const accessToken = getStaffAccessToken();

	const sessionStatus = useQuery(api.liveStaff.getLiveSessionStatus, {
		accessToken,
	});

	if (sessionStatus === undefined) {
		return (
			<div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center gap-4">
				<Spinner className="size-8 text-zinc-100" />
			</div>
		);
	}

	if (sessionStatus.status === "active") {
		navigate({ to: "/live/jobs", replace: true });
		return null;
	}

	if (sessionStatus.status === "invalid" || !accessToken) {
		navigate({
			to: "/live/$inviteToken",
			params: { inviteToken: "invalid" },
			replace: true,
		});
		return null;
	}

	const eventTitle = sessionStatus.eventTitle;
	const isAdmin = sessionStatus.isAdmin;

	const handleDismiss = () => {
		clearStaffAccessToken();
		navigate({
			to: "/live/$inviteToken",
			params: { inviteToken: "invalid" },
			replace: true,
		});
	};

	const handleBackToDashboard = () => {
		clearStaffAccessToken();
		navigate({ to: "/app/dashboard", search: { checkoutSlug: undefined } });
	};

	return (
		<div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4">
			<div className="w-full max-w-md p-8 flex flex-col justify-center">
				<p className="logo mb-4">Asistir</p>
				<p className="text-md font-bold text-zinc-100">Event ended</p>
				{eventTitle ? (
					<p className="mt-1 text-sm font-medium text-zinc-300">{eventTitle}</p>
				) : null}
				<p className="mt-3 text-sm text-zinc-400 leading-normal">
					The admin has ended the event. Thank you for your assistance.
				</p>

				<div className="mt-8 flex flex-col gap-3 w-full">
					{isAdmin ? (
						<Button
							type="button"
							size="lg"
							className="w-full"
							onClick={handleBackToDashboard}
						>
							Back to Dashboard
						</Button>
					) : (
						<Button
							type="button"
							variant="secondary"
							size="lg"
							className="w-full"
							onClick={handleDismiss}
						>
							Close
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
