import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { LayoutDashboard, Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { getStaffAccessToken } from "#/lib/staffToken";
import { api } from "../../../convex/_generated/api";

export function AdminEventControls() {
	const navigate = useNavigate();
	const accessToken = getStaffAccessToken();
	const endEvent = useMutation(api.liveStaff.endEventFromLiveFloor);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isEnding, setIsEnding] = useState(false);

	const handleEndEvent = async () => {
		setIsEnding(true);
		try {
			await endEvent({ accessToken });
			setConfirmOpen(false);
			navigate({ to: "/live/ended" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to end event");
		} finally {
			setIsEnding(false);
		}
	};

	return (
		<>
			<div className="px-1">
				<p className="text-md font-bold text-zinc-50">Admin controls</p>
				<p className="text-xs text-zinc-300">
					Navigate back to admin dashboard or{" "}
					<span className="text-red-400">
						end the event (irreversible action)
					</span>
					.
				</p>
			</div>
			<div className="shrink-0 border-t border-zinc-800 px-1 pt-2 pb-4 flex gap-2">
				<Button
					type="button"
					variant="default"
					size="lg"
					className="flex-1 text-zinc-950 hover:bg-zinc-800"
					asChild
				>
					<Link to="/app/dashboard" search={{ checkoutSlug: undefined }}>
						<LayoutDashboard className="size-3.5 mr-1.5" />
						Dashboard
					</Link>
				</Button>
				<Button
					type="button"
					variant="destructive"
					size="lg"
					className="flex-1  text-red-400 hover:bg-red-950/40"
					onClick={() => setConfirmOpen(true)}
				>
					<Power className="size-3.5 mr-1.5" />
					End Event
				</Button>
			</div>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50">
					<DialogHeader>
						<DialogTitle className="text-red-400 uppercase font-bold">
							End this event
						</DialogTitle>
						<DialogDescription className="text-red-200">
							All staff will be disconnected from the live floor immediately and
							event will be archived.{" "}
							<span className="font-bold underline underline-offset-4">
								This action cannot be undone.
							</span>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="border-zinc-800 bg-zinc-900/50 flex flex-row gap-2">
						<Button
							type="button"
							variant="outline"
							className="flex"
							onClick={() => setConfirmOpen(false)}
							disabled={isEnding}
							size={"lg"}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							className="flex"
							onClick={handleEndEvent}
							disabled={isEnding}
							size={"lg"}
						>
							{isEnding ? "Ending…" : "End Event"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
