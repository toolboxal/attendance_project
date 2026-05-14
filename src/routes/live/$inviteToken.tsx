import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { Sparkles, Calendar, MapPin, Shield, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/live/$inviteToken")({
	component: InviteGateComponent,
});

function InviteGateComponent() {
	const { inviteToken } = Route.useParams();
	const navigate = useNavigate();
	const [claiming, setClaiming] = useState(false);

	// 1. 🕵️ Validate the link authenticity against Convex
	const inviteData = useQuery(api.liveStaff.validateInvite, { inviteToken });
	const claimInvite = useMutation(api.liveStaff.claimStaffInvite);

	// Handle Accepting the Assignment!
	const handleAccept = async () => {
		try {
			setClaiming(true);
			// Trigger Convex Mutation: activates profile & destroys the one-time token!
			const result = await claimInvite({ inviteToken });

			// 💳 Save the permanent session Keycard in browser storage!
			localStorage.setItem("asistir_staff_token", result.accessToken);

			toast.success("Welcome to the team! Loading dashboard...");

			// 🏁 Push directly to their live interactive workspace!
			navigate({ to: "/live/jobs", replace: true });
		} catch (err: any) {
			toast.error(err.message || "Failed to claim assignment.");
		} finally {
			setClaiming(false);
		}
	};

	// STATE A: 🌀 High-End Loader
	if (inviteData === undefined) {
		return (
			<div className="min-h-dvh w-full bg-zinc-950 flex flex-col items-center justify-center gap-4">
				<Spinner className="size-8 text-zinc-100" />
				<p className="text-zinc-500 text-sm font-mono animate-pulse">Securely verifying ticket...</p>
			</div>
		);
	}

	// STATE B: ❌ Invalid Link / Expired Ticket
	if (inviteData.valid === false) {
		return (
			<div className="min-h-dvh w-full bg-zinc-950 flex items-center justify-center p-4">
				<div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
					<div className="size-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-6">
						<AlertCircle className="size-8" />
					</div>
					<h1 className="text-xl font-bold text-zinc-100 tracking-tight">Access Link Invalid</h1>
					<p className="text-zinc-400 text-sm mt-3 leading-relaxed">
						{inviteData.message || "This link has already been claimed, expired, or doesn't exist."}
					</p>
					<p className="text-zinc-600 text-xs mt-6 italic">
						Please contact your event administrator to generate a new secure link.
					</p>
				</div>
			</div>
		);
	}

	// STATE C: 🎉 Premium Welcome Intake Portal
	return (
		<div className="min-h-dvh w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center p-4 md:p-8">
			{/* 🔥 Cinematic Backdrop Ambient Glows */}
			<div className="absolute top-[-10%] left-[-20%] size-[80vw] rounded-full bg-indigo-500/10 blur-[100px]" />
			<div className="absolute bottom-[-10%] right-[-20%] size-[80vw] rounded-full bg-violet-500/10 blur-[100px]" />

			{/* 🎟️ The Portal Card */}
			<div className="w-full max-w-md relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10 flex flex-col z-10">
				
				{/* Branding & Floating Icon */}
				<div className="flex flex-col items-center text-center">
					<div className="size-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/5 mb-6">
						<Sparkles className="size-6" />
					</div>
					
					<span className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400 mb-2">
						Access Granted
					</span>
					<h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
						Welcome, <br /> {inviteData.assignedName}!
					</h1>
					<p className="text-zinc-400 text-sm mt-3 leading-relaxed">
						You have been secure-listed as event staff. Here are your assignment details:
					</p>
				</div>

				{/* 📋 The Specs Sheet */}
				<div className="mt-8 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-5">
					<div className="flex items-start gap-4">
						<div className="size-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400 shrink-0">
							<Calendar className="size-4" />
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Event</span>
							<span className="text-zinc-200 text-sm font-semibold">{inviteData.eventTitle}</span>
						</div>
					</div>

					<div className="flex items-start gap-4">
						<div className="size-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400 shrink-0">
							<MapPin className="size-4" />
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Location</span>
							<span className="text-zinc-200 text-sm font-semibold">{inviteData.eventLocation || "Main Arena"}</span>
						</div>
					</div>

					<div className="flex items-start gap-4">
						<div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/10">
							<Shield className="size-4" />
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Your Role</span>
							<span className="text-indigo-300 text-sm font-extrabold uppercase tracking-wider">{inviteData.roleTitle}</span>
						</div>
					</div>
				</div>

				{/* Security Disclaimer */}
				<p className="text-zinc-500 text-center text-[10px] mt-6 font-mono">
					🔐 This secure invitation key can only be claimed once.
				</p>

				{/* 🚀 ACCEPT BUTTON */}
				<Button
					onClick={handleAccept}
					disabled={claiming}
					className="w-full mt-6 py-7 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold tracking-wide shadow-xl hover:shadow-zinc-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
				>
					{claiming ? (
						<>
							<Spinner className="size-4 text-zinc-950" />
							<span>Activating Keycard...</span>
						</>
					) : (
						<>
							<span>Claim Ticket & Enter</span>
							<ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
