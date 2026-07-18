import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { tv } from "tailwind-variants";
import { BroadcastBanner } from "#/components/broadcast/BroadcastBanner";
import { ErrorView } from "#/components/error-view";
import { JobAcceptanceToasts } from "#/components/jobs/JobAcceptanceToasts";
import { Spinner } from "#/components/ui/spinner";
import {
	countUnseenNewAlerts,
	getKnownAlertIds,
	markAlertsKnown,
} from "#/lib/alertReadState";
import { parseStructuredError } from "#/lib/error-utils";
import { clearStaffAccessToken } from "#/lib/staffToken";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const navBarItem = tv({
	slots: {
		navBar:
			"fixed bottom-1 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md h-14 bg-zinc-800 rounded-3xl flex items-center justify-around px-2 z-50 border-t border-zinc-700",
		tab: "relative flex flex-col items-center gap-1 text-zinc-400 text-[11px] font-bold uppercase hover:text-zinc-100 transition-all px-3 py-2 [&.active]:text-yellow-500 [&.active]:scale-110",
	},
});

export const Route = createFileRoute("/live/_dashboard")({
	component: DashboardAuthLayout,
	notFoundComponent: () => (
		<div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center bg-zinc-950 text-zinc-100">
			<ErrorView
				title="Activity Missing"
				reason="Page Not Found"
				actionNeeded="This job post or section is no longer active. Tap below to refresh your assignments."
				showHomeButton={false}
			/>
		</div>
	),
	errorComponent: ({ error, reset }) => {
		const errorData = parseStructuredError(error);
		return (
			<div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center bg-zinc-950 text-zinc-100">
				<ErrorView
					title={errorData.title || "Something went wrong"}
					errorType={errorData.errorType}
					reason={errorData.reason || "An unexpected error occurred."}
					actionNeeded={
						errorData.actionNeeded ||
						"Please try again or contact your administrator."
					}
					onBack={() => reset()}
					showHomeButton={false}
				/>
			</div>
		);
	},
});

function DashboardAuthLayout() {
	const { navBar, tab } = navBarItem();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [isAuthenticating, setIsAuthenticating] = useState(true);
	const [hasToken, setHasToken] = useState(false);
	const [knownAlertIds, setKnownAlertIds] = useState<Set<string>>(
		() => new Set(),
	);
	const knownAlertsInitialized = useRef(false);
	const lastEventIdRef = useRef<Id<"events"> | undefined>(undefined);

	const token =
		typeof window !== "undefined"
			? localStorage.getItem("asistir_staff_token")
			: null;

	const profile = useQuery(api.liveStaff.getProfile, {
		accessToken: token || "",
	});

	const sessionStatus = useQuery(
		api.liveStaff.getLiveSessionStatus,
		token && profile === null ? { accessToken: token } : "skip",
	);

	const activeAlerts = useQuery(
		api.alerts.getActiveAlerts,
		token && hasToken ? { accessToken: token } : "skip",
	);

	const isOnAlertTab = pathname.startsWith("/live/alert");
	const eventId = profile?.eventId as Id<"events"> | undefined;

	useEffect(() => {
		if (profile === undefined) return;

		if (!token) {
			setHasToken(false);
			setIsAuthenticating(false);
			navigate({
				to: "/live/$inviteToken",
				params: { inviteToken: "invalid" },
			});
			return;
		}

		if (profile !== null) {
			setHasToken(true);
			setIsAuthenticating(false);
			return;
		}

		if (sessionStatus === undefined) return;

		setIsAuthenticating(false);

		if (sessionStatus.status === "ended") {
			navigate({ to: "/live/ended" });
			return;
		}

		clearStaffAccessToken();
		setHasToken(false);
		navigate({
			to: "/live/$inviteToken",
			params: { inviteToken: "invalid" },
		});
	}, [navigate, token, profile, sessionStatus]);

	useEffect(() => {
		if (eventId !== lastEventIdRef.current) {
			lastEventIdRef.current = eventId;
			knownAlertsInitialized.current = false;
			setKnownAlertIds(new Set());
		}

		if (!eventId || activeAlerts === undefined) return;

		const alertIds = activeAlerts.map((alert) => alert._id);

		if (!knownAlertsInitialized.current) {
			const stored = getKnownAlertIds(eventId);
			if (stored.size === 0) {
				setKnownAlertIds(markAlertsKnown(eventId, alertIds));
			} else {
				setKnownAlertIds(stored);
			}
			knownAlertsInitialized.current = true;
			return;
		}

		if (isOnAlertTab) {
			setKnownAlertIds(markAlertsKnown(eventId, alertIds));
		}
	}, [activeAlerts, eventId, isOnAlertTab]);

	const unseenNewAlertCount = useMemo(() => {
		if (!activeAlerts || isOnAlertTab) return 0;
		return countUnseenNewAlerts(activeAlerts, knownAlertIds, profile?._id);
	}, [activeAlerts, knownAlertIds, profile?._id, isOnAlertTab]);

	if (isAuthenticating) {
		return (
			<div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center gap-4">
				<Spinner className="size-8 text-zinc-100" />
				<p className="text-zinc-500 text-xs font-mono">Initializing...</p>
			</div>
		);
	}

	if (!hasToken || !token) return null;

	return (
		<div className="bg-zinc-950 text-zinc-100">
			<main className="w-full max-w-md mx-auto px-1 pt-2 bg-zinc-950">
				<Outlet />
			</main>
			<BroadcastBanner accessToken={token} />
			<JobAcceptanceToasts accessToken={token} />

			<nav className={navBar()}>
				{profile?.isAdmin ? (
					<Link to="/live/admin" className={tab()}>
						<span>Admin</span>
					</Link>
				) : profile?.isSupervisor ? (
					<Link to="/live/assign" className={tab()}>
						<span>Assign</span>
					</Link>
				) : null}

				<Link to="/live/jobs" className={tab()}>
					<span>Traffic</span>
				</Link>

				<Link to="/live/alert" className={tab()}>
					<span>Alert</span>
					{unseenNewAlertCount > 0 && (
						<span
							className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-zinc-50 -z-10"
							title={`${unseenNewAlertCount} new alert${unseenNewAlertCount === 1 ? "" : "s"}`}
						>
							{unseenNewAlertCount}
						</span>
					)}
				</Link>

				<Link to="/live/roster" className={tab()}>
					<span>Roster</span>
				</Link>
			</nav>
		</div>
	);
}
