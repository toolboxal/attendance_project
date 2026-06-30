import { useMutation } from "convex/react";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	buildStaffInviteShareMessage,
	shareStaffInvite,
} from "#/lib/staff-invite-share";
import { formatTime12h } from "#/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export function AssignRoleDialog({
	slot,
	section,
}: {
	slot: Doc<"roleSlots">;
	section: Doc<"eventSections">;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [inviteUrl, setInviteUrl] = useState("");

	const createInvite = useMutation(api.liveStaff.createStaffInvitation);

	const handleAssign = async () => {
		if (!name.trim()) {
			toast.error("Please enter a name first!");
			return;
		}

		try {
			setLoading(true);
			const result = await createInvite({
				slotId: slot._id,
				staffName: name.trim(),
			});

			// Generate absolute URL pointing to our public dynamic live route!
			const joinLink = `${window.location.origin}/live/${result.inviteToken}`;
			setInviteUrl(joinLink);

			toast.success("Staff assigned successfully!");
		} catch (err: any) {
			toast.error(err.message || "Failed to generate invite.");
		} finally {
			setLoading(false);
		}
	};

	const shareTextFull = inviteUrl
		? buildStaffInviteShareMessage({
				staffName: name,
				roleTitle: slot.title,
				sectionName: section.name,
				startTime: section.startTime,
				endTime: section.endTime,
				role: slot.role,
				inviteUrl,
			})
		: "";

	const handleShareInvite = () => {
		if (!shareTextFull) return;
		void shareStaffInvite(shareTextFull, `Event Assignment — ${slot.title}`);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) {
					setInviteUrl("");
					setName("");
				} // Reset on close
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant={"link"}
					size={"sm"}
					className="ml-auto text-sm font-normal text-zinc-400 hover:text-zinc-200 px-2 h-auto"
				>
					Assign
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">
						Assign {slot.title}
					</DialogTitle>
					<DialogDescription asChild className="text-zinc-400">
						<div>
							<div>
								<span className="text-yellow-100 font-mono text-xs">
									{formatTime12h(section.startTime || "")}
								</span>
								<span>→</span>
								<span className="text-yellow-100 font-mono text-xs">
									{formatTime12h(section.endTime || "")}
								</span>
							</div>
							<p className="text-zinc-100 text-sm uppercase mt-1">
								{section.name}
							</p>
						</div>
					</DialogDescription>
				</DialogHeader>

				{!inviteUrl ? (
					<div className="grid gap-4 pb-4">
						<div className="grid items-center gap-2">
							<Label
								htmlFor="name"
								className="text-xs font-semibold text-zinc-500"
							>
								{slot.role === "supervisor" ? "Supervisor" : "Staff"} Name
							</Label>
							<Input
								id="name"
								placeholder="e.g. Cornelius Smith"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11"
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button
								onClick={handleAssign}
								disabled={loading}
								className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950"
							>
								{loading ? "Generating..." : "Generate Secure Invite Link"}
							</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="grid gap-4 py-4">
						<div className="">
							<p className="text-green-400 font-bold text-xs">
								Secure Link Generated
							</p>
							<p className="text-zinc-300 text-xs">
								Share this invite with {name} now.
							</p>
						</div>

						<Button
							type="button"
							onClick={handleShareInvite}
							disabled={!shareTextFull}
							className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:pointer-events-none text-zinc-950 font-bold py-6 rounded-xl text-sm w-full"
						>
							<Share2 className="size-4" />
							Share invite
						</Button>

						<DialogClose asChild>
							<Button
								variant="ghost"
								className="w-full text-zinc-500"
								size={"lg"}
							>
								Done
							</Button>
						</DialogClose>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
