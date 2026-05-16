import {
	createFileRoute,
	Outlet,
	useNavigate,
	Link,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Spinner } from "#/components/ui/spinner";
import { Briefcase, MessageSquare, Users, LogOut } from "lucide-react";

export const Route = createFileRoute("/live/_dashboard")({
	component: DashboardAuthLayout,
});

function DashboardAuthLayout() {
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
		<div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col pb-24">
			{/* Main Content Area */}
			<main className="flex-1 w-full max-w-md mx-auto px-4 pt-6 overflow-y-auto">
				<Outlet />
			</main>

			{/* 📱 HIGH-END FLOATING BOTTOM NAV BAR */}
			<nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md h-20 bg-zinc-900/80 backdrop-blur-xl  rounded-lg flex items-center justify-around px-4 shadow-2xl z-50">
				{/* TAB 1: JOBS */}
				<Link
					to="/live/jobs"
					className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-all px-4 py-2 [&.active]:text-indigo-400 [&.active]:scale-110"
				>
					<Briefcase className="size-5" />
					<span className="text-[10px] font-bold tracking-wider uppercase">
						Jobs
					</span>
				</Link>

				{/* TAB 2: CHAT */}
				<Link
					to="/live/chat"
					className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-all px-4 py-2 [&.active]:text-indigo-400 [&.active]:scale-110"
				>
					<MessageSquare className="size-5" />
					<span className="text-[10px] font-bold tracking-wider uppercase">
						Chat
					</span>
				</Link>

				{/* TAB 3: ROSTER */}
				<Link
					to="/live/roster"
					className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-all px-4 py-2 [&.active]:text-indigo-400 [&.active]:scale-110"
				>
					<Users className="size-5" />
					<span className="text-[10px] font-bold tracking-wider uppercase">
						Roster
					</span>
				</Link>

				{/* SECURE LOGOUT */}
				<button
					type="button"
					onClick={() => {
						localStorage.removeItem("asistir_staff_token");
						window.location.reload(); // Clears session instantly!
					}}
					className="flex flex-col items-center gap-1 text-zinc-600 hover:text-red-400 transition-all px-4 py-2"
				>
					<LogOut className="size-5" />
					<span className="text-[10px] font-bold tracking-wider uppercase">
						Exit
					</span>
				</button>
			</nav>
		</div>
	);
}
