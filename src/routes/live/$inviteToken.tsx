import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorView } from "#/components/error-view";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { OG_IMAGE_META, SITE_URL } from "#/lib/seo";
import { formatTime12h } from "#/lib/utils";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../convex/_generated/api";

const INVITE_TITLE = "You're invited on Asistir";
const INVITE_DESCRIPTION =
	"Claim your event assignment and open your live staff workspace.";

export const Route = createFileRoute("/live/$inviteToken")({
	head: ({ params }) => ({
		meta: [
			{ title: INVITE_TITLE },
			{ name: "description", content: INVITE_DESCRIPTION },
			{ name: "robots", content: "noindex" },
			{ property: "og:title", content: INVITE_TITLE },
			{ property: "og:description", content: INVITE_DESCRIPTION },
			{
				property: "og:url",
				content: `${SITE_URL}/live/${params.inviteToken}`,
			},
			...OG_IMAGE_META,
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: INVITE_TITLE },
			{ name: "twitter:description", content: INVITE_DESCRIPTION },
		],
	}),
	component: InviteGateComponent,
});

function InviteGateComponent() {
	const { inviteToken } = Route.useParams();
	const navigate = useNavigate();
	const [claiming, setClaiming] = useState(false);
	const [claimed, setClaimed] = useState(false);
	const [claimError, setClaimError] = useState<{
		errorType?: number;
		reason?: string;
		actionNeeded?: string;
	} | null>(null);

	// 1. 🕵️ Validate the link authenticity against Convex
	const inviteData = useQuery(api.liveStaff.validateInvite, { inviteToken });
	const claimInvite = useMutation(api.liveStaff.claimStaffInvite);

	// Handle Accepting the Assignment!
	const handleAccept = async () => {
		try {
			setClaiming(true);
			setClaimError(null);
			// Trigger Convex Mutation: activates profile & destroys the one-time token!
			const result = await claimInvite({ inviteToken });

			if (result.success && result.accessToken) {
				// 💳 Save the permanent session Keycard in browser storage!
				localStorage.setItem("asistir_staff_token", result.accessToken);
				setClaimed(true);

				toast.success("Welcome to the team!");

				// 🏁 Push directly to their live interactive workspace!
				navigate({ to: "/live/jobs", replace: true });
			} else {
				// Handle structured error (e.g. event not live yet)
				setClaimError({
					errorType: result.errorType,
					reason: result.reason,
					actionNeeded: result.actionNeeded,
				});
			}
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to claim assignment.";
			toast.error(errorMessage);
		} finally {
			setClaiming(false);
		}
	};

	// STATE A: High-End Loader
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

	if (claiming || claimed) {
		return (
			<div className="min-h-dvh w-full bg-zinc-950 flex flex-col items-center justify-center gap-4">
				<Spinner className="size-6 text-zinc-200 mb-4" />
				<p className="logo animate-pulse">Asistir</p>
				<p className="text-zinc-500 text-sm font-medium">
					activating keycard and loading dashboard
				</p>
			</div>
		);
	}

	// STATE B: ❌ Invalid Link / Expired Ticket / Claim Error
	const isError = inviteData.valid === false || claimError !== null;
	if (isError && !claimed) {
		const error =
			inviteData.valid === false
				? inviteData
				: (claimError as typeof inviteData);

		const isRevoked = inviteToken === "invalid";

		return (
			<div className="min-h-dvh w-full bg-zinc-950 flex items-center justify-center">
				<ErrorView
					title={isRevoked ? "Session Expired" : "Access Denied"}
					errorType={error.errorType}
					reason={
						isRevoked
							? "Your access has been revoked or session expired."
							: error.reason || ""
					}
					actionNeeded={
						isRevoked
							? "Please contact your administrator to request a new invite link."
							: error.actionNeeded || ""
					}
					showBackButton={!isRevoked}
				/>
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
						<div className="flex flex-row items-start gap-2 justify-between">
							<span className="logo">Asistir</span>
							{inviteData.valid && (
								<span
									className={`px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest animate-pulse  ${
										inviteData.eventStatus === "live"
											? " text-emerald-500"
											: " text-amber-500"
									}`}
								>
									{inviteData.eventStatus === "live"
										? "event is live"
										: "waiting to go live"}
								</span>
							)}
						</div>
						<h1 className="text-lg font-bold text-zinc-100">
							Welcome, {inviteData.assignedName}.
						</h1>

						<div>
							<p className="text-zinc-500 font-mono text-xs flex gap-2 my-0.5">
								<span className="text-yellow-100 font-medium">
									{formatTime12h(inviteData.sectionStartTime || "")}
								</span>
								<span className="text-yellow-100">→</span>
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
						<p className="text-zinc-400 text-sm leading-tight">
							You have been assigned as event {inviteData.roleType}. <br />
							This invitation can only be claimed once. <br />
							No log in is required.
						</p>
					</div>
				</div>
				<Separator orientation="horizontal" className="lg:hidden" />
				<Separator orientation="vertical" className="hidden lg:block" />
				{/* 📋 The Specs Sheet */}
				<div className="flex-1 rounded-2xl pt-1 space-y-5">
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
						variant={"default"}
						size={"xl"}
						className="w-full mt-2 text-md"
					>
						<span>Enter</span>
						<ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
					</Button>
				</div>
			</div>
		</div>
	);
}
