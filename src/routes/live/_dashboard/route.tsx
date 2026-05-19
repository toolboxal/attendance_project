import {
	createFileRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { tv } from "tailwind-variants";
import { Spinner } from "#/components/ui/spinner";

const navBarItem = tv({
	slots: {
		navBar:
			"fixed bottom-1 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md h-14 bg-zinc-800 rounded-3xl flex items-center justify-around px-2 z-50 border-t border-zinc-700",
		tab: "flex flex-col items-center gap-1 text-zinc-400 text-[11px] font-bold uppercase hover:text-zinc-100 transition-all px-4 py-2 [&.active]:text-yellow-500 [&.active]:scale-110",
	},
});

export const Route = createFileRoute("/live/_dashboard")({
	component: DashboardAuthLayout,
});

function DashboardAuthLayout() {
	const { navBar, tab } = navBarItem();
	const navigate = useNavigate();
	const [isAuthenticating, setIsAuthenticating] = useState(true);
	const [hasToken, setHasToken] = useState(false);

	useEffect(() => {
		// 🔐 Perform the local secure handshake verification
		const token = localStorage.getItem("asistir_staff_token");

		if (!token) {
			setHasToken(false);
			setIsAuthenticating(false);
			// Re-route bad actors or lost sessions to the intake failure space
			navigate({
				to: "/live/$inviteToken",
				params: { inviteToken: "invalid" },
			});
		} else {
			setHasToken(true);
			setIsAuthenticating(false);
		}
	}, [navigate]);

	// State A: Loading Check
	if (isAuthenticating) {
		return (
			<div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center gap-4">
				<Spinner className="size-8 text-zinc-100" />
				<p className="text-zinc-500 text-xs font-mono">Initializing...</p>
			</div>
		);
	}

	// State B: Access Blocked
	if (!hasToken) return null;

	// State C: Access Granted! Render the workspace & The persistent Bottom Nav Bar!
	return (
		<div className="bg-zinc-950 text-zinc-100">
			{/* Main Content Area */}
			<main className="w-full max-w-md mx-auto px-1 pt-2 bg-zinc-950">
				<Outlet />
			</main>

			{/* 📱 HIGH-END FLOATING BOTTOM NAV BAR */}
			<nav className={navBar()}>
				{/* TAB 1: JOBS */}
				<Link to="/live/jobs" className={tab()}>
					{/* <Briefcase className="size-5" /> */}
					<span>Jobs</span>
				</Link>

				{/* TAB 2: CHAT */}
				<Link to="/live/chat" className={tab()}>
					{/* <MessageSquare className="size-5" /> */}
					<span>Chat</span>
				</Link>

				{/* TAB 3: ROSTER */}
				<Link to="/live/roster" className={tab()}>
					{/* <Users className="size-5" /> */}
					<span>Roster</span>
				</Link>

				{/* SECURE LOGOUT */}
				<button
					type="button"
					onClick={() => {
						localStorage.removeItem("asistir_staff_token");
						window.location.reload(); // Clears session instantly!
					}}
					className={tab()}
				>
					{/* <LogOut className="size-5" /> */}
					<span>Exit</span>
				</button>
			</nav>
		</div>
	);
}
