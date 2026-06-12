import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { tv } from "tailwind-variants";
import { BroadcastBanner } from "#/components/broadcast/BroadcastBanner";
import { ErrorView } from "#/components/error-view";
import { Spinner } from "#/components/ui/spinner";
import { parseStructuredError } from "#/lib/error-utils";
import { api } from "../../../../convex/_generated/api";

const navBarItem = tv({
	slots: {
		navBar:
			"fixed bottom-1 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md h-14 bg-zinc-800 rounded-3xl flex items-center justify-around px-2 z-50 border-t border-zinc-700",
		tab: "flex flex-col items-center gap-1 text-zinc-400 text-[11px] font-bold uppercase hover:text-zinc-100 transition-all px-3 py-2 [&.active]:text-yellow-500 [&.active]:scale-110",
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
	const [isAuthenticating, setIsAuthenticating] = useState(true);
	const [hasToken, setHasToken] = useState(false);

	const token =
		typeof window !== "undefined"
			? localStorage.getItem("asistir_staff_token")
			: null;

	const profile = useQuery(api.liveStaff.getProfile, {
		accessToken: token || "",
	});

	useEffect(() => {
		if (profile === undefined) return;

		if (!token || profile === null) {
			setHasToken(false);
			setIsAuthenticating(false);

			if (token && profile === null) {
				localStorage.removeItem("asistir_staff_token");
			}

			navigate({
				to: "/live/$inviteToken",
				params: { inviteToken: "invalid" },
			});
		} else {
			setHasToken(true);
			setIsAuthenticating(false);
		}
	}, [navigate, token, profile]);

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

			<nav className={navBar()}>
				<Link to="/live/jobs" className={tab()}>
					<span>Traffic</span>
				</Link>

				<Link to="/live/alert" className={tab()}>
					<span>Alert</span>
				</Link>

				<Link to="/live/roster" className={tab()}>
					<span>Roster</span>
				</Link>

				{profile?.isAdmin && (
					<Link to="/live/admin" className={tab()}>
						<span>Admin</span>
					</Link>
				)}
			</nav>
		</div>
	);
}
