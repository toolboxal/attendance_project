import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Check, ChevronDown, Copy, Share2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export function ManageStaffDialog({
	slot,
	section,
	staff,
}: {
	slot: Doc<"roleSlots">;
	section: Doc<"eventSections">;
	staff: Doc<"liveStaff">;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(staff.name);
	const [saving, setSaving] = useState(false);
	const [revoking, setRevoking] = useState(false);
	const [copied, setCopied] = useState(false);

	const updateStaff = useMutation(api.liveStaff.createStaffInvitation);
	const revokeStaff = useMutation(api.liveStaff.revokeStaffAccess);

	// Sync local input state if the underlying data updates from external push
	useEffect(() => {
		setName(staff.name);
	}, [staff.name]);

	const handleUpdateName = async () => {
		if (!name.trim()) {
			toast.error("Name cannot be empty!");
			return;
		}
		try {
			setSaving(true);
			await updateStaff({
				slotId: slot._id,
				staffName: name.trim(),
			});
			toast.success("Staff name updated successfully!");
			setOpen(false);
		} catch (err: any) {
			toast.error(err.message || "Failed to update name.");
		} finally {
			setSaving(false);
		}
	};

	const handleRevoke = async () => {
		if (
			!window.confirm(
				`Are you sure you want to revoke access for ${staff.name}? This will instantly deactivate their live workspace and clear this role slot.`,
			)
		) {
			return;
		}
		try {
			setRevoking(true);
			await revokeStaff({
				slotId: slot._id,
			});
			toast.success("Access revoked successfully.");
			setOpen(false);
		} catch (err: any) {
			toast.error(err.message || "Failed to revoke access.");
		} finally {
			setRevoking(false);
		}
	};

	// Build re-sharing components if ticket is un-claimed
	const inviteUrl = slot.inviteToken
		? `${window.location.origin}/live/${slot.inviteToken}`
		: "";

	const shareTextBody = `Hi ${name}! Here is your secure access link for your assignment as ${slot.title}:`;
	const shareTextFull = `${shareTextBody}\n\n${inviteUrl}`;

	const handleNativeShare = async () => {
		try {
			if (navigator.share && inviteUrl) {
				await navigator.share({
					title: `Access Link for ${name}`,
					text: shareTextBody,
					url: inviteUrl,
				});
			}
		} catch (err) {
			console.log("Share failed:", err);
		}
	};

	const handleCopy = () => {
		if (!inviteUrl) return;
		navigator.clipboard.writeText(inviteUrl);
		setCopied(true);
		toast.success("Copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
	};

	const canShare =
		typeof navigator !== "undefined" && !!navigator.share && !!inviteUrl;
	const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(shareTextFull)}`;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button
					type="button"
					className="flex flex-row items-center gap-1 ml-auto text-sm font-normal text-zinc-400 hover:text-zinc-200 px-2 h-auto cursor-pointer select-none transition-colors focus:outline-none bg-transparent border-none"
				>
					<p>{staff.name}</p>
					<ChevronDown size={16} strokeWidth={1.5} />
				</button>
			</DialogTrigger>
			<DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">Manage Assignment</DialogTitle>
					<DialogDescription className="text-zinc-400">
						{slot.title} — {section.name}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-2 flex flex-col">
					{/* 📝 Section 1: Rename Helper */}
					<div className="space-y-2 flex flex-col">
						<Label
							htmlFor="edit-staff-name"
							className="text-zinc-400 text-xs uppercase font-bold tracking-wider"
						>
							Update Assigned Helper
						</Label>
						<div className="flex gap-2">
							<Input
								id="edit-staff-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter name"
								className="bg-zinc-950 border-zinc-800 focus:border-zinc-700 flex-1 h-11 text-sm"
							/>
							<Button
								onClick={handleUpdateName}
								disabled={saving || name.trim() === staff.name}
								className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold h-11 px-4"
							>
								{saving ? "Saving..." : "Update"}
							</Button>
						</div>
					</div>

					{/* ⏳ Section 2: Pending Invite Re-sharing (Conditional) */}
					{inviteUrl && (
						<div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 space-y-3 mt-2 flex flex-col">
							<div className="flex flex-col">
								<span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
									<span className="size-2 rounded-full bg-amber-400/80 animate-pulse" />
									⏳ Invite Pending Claim
								</span>
								<p className="text-zinc-500 text-[11px] mt-1 leading-relaxed">
									The worker has not loaded this ticket yet. Re-share or copy
									the active access token below:
								</p>
							</div>

							<div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800/80 rounded-lg p-2 pr-1.5 text-xs font-mono text-zinc-400 select-all truncate mt-1">
								<span className="flex-1 truncate pl-1">{inviteUrl}</span>
								<Button
									size="sm"
									onClick={handleCopy}
									className="shrink-0 bg-zinc-800 hover:bg-zinc-700 h-8 w-8 p-0 rounded-md"
								>
									{copied ? (
										<Check className="size-3.5 text-emerald-400" />
									) : (
										<Copy className="size-3.5 text-zinc-400" />
									)}
								</Button>
							</div>

							<div className="pt-1">
								{canShare ? (
									<Button
										onClick={handleNativeShare}
										className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-5 rounded-xl text-xs flex items-center justify-center gap-2"
									>
										<Share2 className="size-3.5" /> Share Invite Link
									</Button>
								) : (
									<a
										href={whatsAppUrl}
										target="_blank"
										rel="noreferrer"
										className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c35e] text-white font-bold py-2.5 rounded-lg text-xs transition-colors w-full"
									>
										Share via WhatsApp
									</a>
								)}
							</div>
						</div>
					)}

					{/* 🟢 Section 2: Claimed & Fully Active (Conditional) */}
					{!inviteUrl && (
						<div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 flex flex-col mt-2">
							<span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
								<span className="size-2 bg-emerald-400 rounded-full animate-pulse" />
								🟢 Activated & Active
							</span>
							<p className="text-zinc-500 text-[11px] mt-1.5 leading-relaxed">
								{staff.name} successfully claimed their ticket and has an active
								browser keycard session.
							</p>
						</div>
					)}

					{/* Separator */}
					<div className="h-px bg-zinc-800/60 w-full my-1" />

					{/* 🚨 Section 3: Danger Zone (Revocation) */}
					<div className="pt-2 flex flex-col gap-2 text-center">
						<Button
							variant="destructive"
							onClick={handleRevoke}
							disabled={revoking}
							className="w-full border border-red-500/10 hover:bg-red-950/20 text-red-500 font-bold py-6 rounded-xl transition-colors"
						>
							{revoking ? "Revoking..." : "Revoke Access & Remove Assignment"}
						</Button>
						<span className="text-[10px] text-zinc-500 font-medium">
							⚠️ Instantly invalidates their token and locks out their device.
						</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
