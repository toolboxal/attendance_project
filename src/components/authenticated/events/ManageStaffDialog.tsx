import { useMutation } from "convex/react";
import { Check, ChevronDown, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { formatTime12h } from "#/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export function ManageStaffDialog({
	slot,
	section,
	staff,
	isArchived = false,
}: {
	slot: Doc<"roleSlots">;
	section: Doc<"eventSections">;
	staff: Doc<"liveStaff">;
	isArchived?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(staff.staffName);
	const [saving, setSaving] = useState(false);
	const [revoking, setRevoking] = useState(false);
	const [copied, setCopied] = useState(false);

	const updateStaff = useMutation(api.liveStaff.createStaffInvitation);
	const revokeStaff = useMutation(api.liveStaff.revokeStaffAccess);

	// Sync local input state if the underlying data updates from external push
	useEffect(() => {
		setName(staff.staffName);
	}, [staff.staffName]);

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
				`Are you sure you want to revoke access for ${staff.staffName}? This will instantly deactivate their live workspace and clear this role slot.`,
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
					<p>{staff.staffName}</p>
					<ChevronDown size={16} strokeWidth={1.5} />
				</button>
			</DialogTrigger>
			<DialogContent
				onOpenAutoFocus={(e) => e.preventDefault()}
				className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50"
			>
				<DialogHeader>
					<DialogTitle className="text-zinc-100">Manage Assignment</DialogTitle>

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
								{section.name} → {slot.title}
							</p>
						</div>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2 flex flex-col">
					{isArchived ? (
						<div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 flex flex-col">
							<span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
								Event expired
							</span>
							<p className="text-zinc-300 text-[11px] mt-1.5 leading-relaxed">
								{inviteUrl
									? `${staff.staffName} was assigned but did not claim before the event ended.`
									: `Event expired but ${staff.staffName} successfully claimed their assignment.`}
							</p>
						</div>
					) : (
						<>
							{/* 📝 Section 1: Rename Helper */}
							<div className="space-y-2 flex flex-col">
								<Label
									htmlFor="edit-staff-name"
									className="text-xs font-semibold text-zinc-500"
								>
									Update name
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
										disabled={saving || name.trim() === staff.staffName}
										className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium h-11 px-4"
									>
										{saving ? "Saving..." : "Update"}
									</Button>
								</div>
							</div>

							{/* ⏳ Section 2: Pending Invite Re-sharing (Conditional) */}
							{inviteUrl && (
						<div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 space-y-3 mt-2 flex flex-col">
							<div className="flex flex-col">
								<span className="text-yellow-400 font-bold text-xs">
									In Pending Mode
								</span>
								<p className="text-zinc-300 text-[12px] mt-1">
									Event must go live to activate this assignment.
								</p>
							</div>

							<div className="flex flex-col gap-2  mt-1 overflow-hidden">
								<div className="flex-1 min-w-0">
									<p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
										Access Link
									</p>
									<p className="break-all text-xs font-mono text-zinc-100 select-all leading-relaxed">
										{inviteUrl}
									</p>
								</div>
								<Button
									onClick={handleCopy}
									className={`w-full mt-2 h-11 transition-all flex items-center justify-center gap-2 font-bold rounded-lg ${
										copied
											? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
											: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
									}`}
								>
									{copied ? (
										<>
											<Check className="size-4" />
											<span>Copied!</span>
										</>
									) : (
										<>
											<Copy className="size-4" />
											<span>Copy Invite Link</span>
										</>
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
										className="flex items-center h-11 justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold py-2.5 rounded-lg text-xs transition-colors w-full"
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
										Activated & Active
									</span>
									<p className="text-zinc-300 text-[11px] mt-1.5 leading-relaxed">
										{staff.staffName} successfully claimed their assignment.
									</p>
								</div>
							)}

							{/* Separator */}
							<div className="h-px bg-zinc-800/60 w-full my-1" />

							{/* 🚨 Section 3: Danger Zone (Revocation) */}
							<div className="pt-1 flex flex-col gap-2 text-center">
								<Button
									variant="destructive"
									onClick={handleRevoke}
									disabled={revoking}
									className="w-full border border-red-500/10 hover:bg-red-950/20 text-red-500 font-bold py-6 rounded-xl transition-colors"
								>
									{revoking ? "Revoking..." : "Revoke Access & Remove Assignment"}
								</Button>
								<span className="text-xs text-red-200 font-medium italic">
									Instantly revokes their token and locks out their device.
								</span>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
