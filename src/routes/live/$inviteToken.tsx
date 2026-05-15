import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";
import { formatTime12h } from "#/lib/utils";

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
			<div className="min-h-dvh w-full bg-zinc-950 flex flex-col items-center justify-center gap-4 ">
				<Spinner className="size-6 text-zinc-200 mb-4" />
				<p className="logo animate-pulse">Asistir</p>
				<p className="text-zinc-500 text-sm font-medium">
					verifying link and assignment
				</p>
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
					<h1 className="text-xl font-bold text-zinc-100 tracking-tight">
						Access Link Invalid
					</h1>
					<p className="text-zinc-400 text-sm mt-3 leading-relaxed">
						{inviteData.message ||
							"This link has already been claimed, expired, or doesn't exist."}
					</p>
					<p className="text-zinc-600 text-xs mt-6 italic">
						Please contact your event administrator to generate a new secure
						link.
					</p>
				</div>
			</div>
		);
	}

	// STATE C: 🎉 Premium Welcome Intake Portal
	return (
		<div className="min-h-dvh w-full bg-zinc-950 overflow-hidden flex items-center justify-center p-2 md:p-8">
			{/*  The Portal Card */}
			<div className="w-full max-w-md p-6 flex flex-col lg:flex-row lg:max-w-3xl lg:gap-8 gap-4">
				<div className="flex flex-col gap-2 flex-1">
					{/* Logo and Welcome message */}
					<div className="flex flex-col gap-3">
						<span className="logo">Asistir</span>
						<h1 className="text-lg font-bold text-zinc-100">
							Welcome, {inviteData.assignedName}.
						</h1>

						<div>
							<p className="text-zinc-500 font-mono text-xs flex gap-2 my-0.5">
								<span className="text-yellow-100 font-medium">
									{formatTime12h(inviteData.sectionStartTime || "")}
								</span>
								<span>→</span>
								<span className="text-yellow-100 font-medium">
									{formatTime12h(inviteData.sectionEndTime || "")}
								</span>
							</p>
							<p className="text-zinc-100 font-bold text-md capitalize">
								{inviteData.sectionName}
							</p>
							<p className="text-zinc-100 font-bold text-md capitalize">
								{inviteData.roleTitle}
							</p>
							<p className="text-zinc-100 font-bold text-[11px] capitalize">
								{inviteData.roleType}
							</p>
						</div>
						<p className="text-zinc-400 text-sm">
							You have been assigned as event {inviteData.roleType}. <br />
							This invitation can only be claimed once. <br />
							No log in is required.
						</p>
					</div>
				</div>
				<Separator orientation="horizontal" className="lg:hidden" />
				<Separator orientation="vertical" className="hidden lg:block" />
				{/* 📋 The Specs Sheet */}
				<div className="flex-1 rounded-2xl  space-y-5">
					<div className="flex flex-col gap-0.5">
						<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
							Event
						</span>
						<span className="text-yellow-100 text-lg font-semibold">
							{inviteData.eventTitle}
						</span>
						<span className="text-zinc-400 text-sm font-semibold">
							{inviteData.eventLocation}
						</span>
					</div>

					<div className="flex flex-col gap-0.5">
						<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
							Date & Time
						</span>
						<span className="text-zinc-200 text-sm font-semibold">
							{format(new Date(inviteData.eventDate || ""), "PPPP")}
						</span>
						<span className="text-zinc-200 text-sm font-semibold">
							{formatTime12h(inviteData.eventTime || "")}
						</span>
					</div>
					{inviteData.eventDescription ? (
						<div className="flex items-start gap-4">
							<div className="flex flex-col gap-0.5">
								<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
									Description
								</span>
								<span className="text-zinc-400 text-sm font-normal">
									{inviteData.eventDescription}
								</span>
							</div>
						</div>
					) : null}
					<Button
						onClick={handleAccept}
						disabled={claiming}
						variant={"default"}
						size={"xl"}
						className="w-full mt-2 text-md"
						// className="w-full mt-6 py-7 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold tracking-wide shadow-xl hover:shadow-zinc-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
					>
						{claiming ? (
							<>
								<Spinner className="size-4 text-zinc-950" />
								<span>Activating Keycard...</span>
							</>
						) : (
							<>
								<span>Enter</span>
								<ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
