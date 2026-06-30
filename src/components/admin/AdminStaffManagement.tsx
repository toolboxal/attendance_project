import { convexQuery } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "#/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { getStaffAccessToken } from "#/lib/staffToken";
import {
	buildStaffInviteShareMessage,
	shareStaffInvite,
} from "#/lib/staff-invite-share";
import { formatFieldErrors, formatTime12h } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const staffNameSchema = z.string().trim().min(1, "Name is required.");

type StaffSlot = {
	slotId: Id<"roleSlots">;
	title: string;
	role: "supervisor" | "staff";
	assignmentStatus: "vacant" | "pending" | "active";
	staffId?: Id<"liveStaff">;
	staffName?: string;
	lastActive?: number;
	inviteToken?: string;
};

type StaffSection = {
	sectionKey: string;
	name: string;
	startTime?: string;
	endTime?: string;
	slots: StaffSlot[];
};

function inviteUrl(inviteToken: string) {
	return `${window.location.origin}/live/${inviteToken}`;
}

function ShareInviteButtons({
	name,
	slotTitle,
	slotRole,
	sectionName,
	sectionStartTime,
	sectionEndTime,
	inviteToken,
}: {
	name: string;
	slotTitle: string;
	slotRole: "supervisor" | "staff";
	sectionName: string;
	sectionStartTime?: string;
	sectionEndTime?: string;
	inviteToken: string;
}) {
	const url = inviteUrl(inviteToken);
	const shareTextFull = buildStaffInviteShareMessage({
		staffName: name,
		roleTitle: slotTitle,
		sectionName,
		startTime: sectionStartTime,
		endTime: sectionEndTime,
		role: slotRole,
		inviteUrl: url,
	});

	const handleShareInvite = () => {
		void shareStaffInvite(shareTextFull, `Event Assignment — ${slotTitle}`);
	};

	return (
		<div className="flex flex-col gap-3 pt-2">
			<div className="flex-1 min-w-0">
				<p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
					Access Link
				</p>
				<p className="break-all text-xs font-mono text-emerald-300 select-all leading-relaxed">
					{url}
				</p>
			</div>
			<Button
				type="button"
				onClick={handleShareInvite}
				className="w-full h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-lg flex items-center justify-center gap-2"
			>
				<Share2 className="size-4" />
				Share invite
			</Button>
		</div>
	);
}

function AssignSlotDialog({
	slot,
	sectionName,
	sectionStartTime,
	sectionEndTime,
	accessToken,
	open,
	onOpenChange,
}: {
	slot: StaffSlot;
	sectionName: string;
	sectionStartTime?: string;
	sectionEndTime?: string;
	accessToken: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [loading, setLoading] = useState(false);
	const [generatedToken, setGeneratedToken] = useState<string | null>(null);
	const [submittedName, setSubmittedName] = useState("");

	const assign = useMutation(api.liveStaff.createStaffInvitationFromLiveFloor);

	const form = useForm({
		defaultValues: { name: "" },
		onSubmit: async ({ value }) => {
			setLoading(true);
			try {
				const trimmed = value.name.trim();
				const result = await assign({
					accessToken,
					slotId: slot.slotId,
					staffName: trimmed,
				});
				setSubmittedName(trimmed);
				if (!result.inviteToken) {
					toast.error("Invite link was not generated. Please try again.");
					return;
				}
				setGeneratedToken(result.inviteToken);
				toast.success("Invite generated.");
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Failed to assign.");
			} finally {
				setLoading(false);
			}
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
			setGeneratedToken(null);
			setSubmittedName("");
		}
	}, [open, form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">
						Assign {slot.title}
					</DialogTitle>
					<DialogDescription className="text-zinc-400">
						<span className="block uppercase text-zinc-300 text-sm mt-1">
							{sectionName}
						</span>
						{sectionStartTime && sectionEndTime ? (
							<span className="font-mono text-xs text-yellow-100">
								{formatTime12h(sectionStartTime)} →{" "}
								{formatTime12h(sectionEndTime)}
							</span>
						) : null}
					</DialogDescription>
				</DialogHeader>

				{!generatedToken ? (
					<form
						noValidate
						className="space-y-3"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<form.Field
							name="name"
							validators={{
								onSubmit: staffNameSchema,
							}}
						>
							{(field) => {
								const hasErrors = field.state.meta.errors.length > 0;
								return (
									<Field>
										<FieldLabel
											htmlFor="assign-name"
											className="text-xs text-zinc-500"
										>
											{slot.role === "supervisor" ? "Supervisor" : "Staff"} name
										</FieldLabel>
										<FieldContent>
											<Input
												id="assign-name"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="e.g. Alexis Chen"
												aria-invalid={hasErrors}
												className="bg-zinc-950 border-zinc-800 text-zinc-100"
											/>
											{hasErrors ? (
												<FieldError className="text-[11px]">
													{formatFieldErrors(field.state.meta.errors)}
												</FieldError>
											) : null}
										</FieldContent>
									</Field>
								);
							}}
						</form.Field>
						<Button
							type="submit"
							className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950"
							disabled={loading}
						>
							{loading ? "Generating…" : "Generate invite link"}
						</Button>
					</form>
				) : (
					<div className="space-y-3">
						<div className="flex flex-col">
							<p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
								Pending Activation
							</p>
							<p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">
								Event must go live and the staff must claim their assignment to
								activate this.
							</p>
						</div>
						<ShareInviteButtons
							name={submittedName}
							slotTitle={slot.title}
							slotRole={slot.role}
							sectionName={sectionName}
							sectionStartTime={sectionStartTime}
							sectionEndTime={sectionEndTime}
							inviteToken={generatedToken}
						/>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ManageSlotDialog({
	slot,
	sectionName,
	sectionStartTime,
	sectionEndTime,
	accessToken,
	open,
	onOpenChange,
}: {
	slot: StaffSlot;
	sectionName: string;
	sectionStartTime?: string;
	sectionEndTime?: string;
	accessToken: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [saving, setSaving] = useState(false);
	const [revoking, setRevoking] = useState(false);
	const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);

	const updateStaff = useMutation(
		api.liveStaff.createStaffInvitationFromLiveFloor,
	);
	const revokeStaff = useMutation(api.liveStaff.revokeStaffFromLiveFloor);

	const form = useForm({
		defaultValues: { name: slot.staffName ?? "" },
		onSubmit: async ({ value }) => {
			setSaving(true);
			try {
				await updateStaff({
					accessToken,
					slotId: slot.slotId,
					staffName: value.name.trim(),
				});
				toast.success("Name updated.");
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Failed to update.");
			} finally {
				setSaving(false);
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({ name: slot.staffName ?? "" });
		} else {
			setConfirmRevokeOpen(false);
		}
	}, [open, slot.staffName, form]);

	const isPending = slot.assignmentStatus === "pending";

	const handleRevoke = async () => {
		setRevoking(true);
		try {
			await revokeStaff({ accessToken, slotId: slot.slotId });
			toast.success(isPending ? "Assignment removed." : "Access revoked.");
			setConfirmRevokeOpen(false);
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to remove.");
		} finally {
			setRevoking(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				onOpenChange(nextOpen);
				if (!nextOpen) setConfirmRevokeOpen(false);
			}}
		>
			<DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">
						Manage {slot.title}
					</DialogTitle>
					<DialogDescription className="text-zinc-400">
						{sectionStartTime && sectionEndTime ? (
							<span className="font-mono text-xs text-yellow-100">
								{formatTime12h(sectionStartTime)} →{" "}
								{formatTime12h(sectionEndTime)}
							</span>
						) : null}
						<span className="block uppercase text-zinc-300 text-sm mt-1">
							{sectionName}
						</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<form
						noValidate
						className="space-y-1"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<form.Field
							name="name"
							validators={{
								onSubmit: staffNameSchema,
							}}
						>
							{(field) => {
								const hasErrors = field.state.meta.errors.length > 0;
								const unchanged =
									field.state.value.trim() === (slot.staffName ?? "");
								return (
									<Field>
										<FieldContent>
											<div className="flex gap-2">
												<Input
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={hasErrors}
													className="bg-zinc-950 border-zinc-800 text-zinc-100 flex-1"
												/>
												<Button
													type="submit"
													size="default"
													disabled={saving || unchanged}
													// className="bg-zinc-800 hover:bg-zinc-700 shrink-0"
												>
													{saving ? "…" : "Update"}
												</Button>
											</div>
											{hasErrors ? (
												<FieldError className="text-[11px]">
													{formatFieldErrors(field.state.meta.errors)}
												</FieldError>
											) : null}
										</FieldContent>
									</Field>
								);
							}}
						</form.Field>
					</form>

					{slot.inviteToken && slot.staffName ? (
						<div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-3">
							<div className="flex flex-col">
								<p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
									Pending Activation
								</p>
								<p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">
									Event must go live and the staff must claim their assignment
									to activate this.
								</p>
							</div>
							<ShareInviteButtons
								name={slot.staffName}
								slotTitle={slot.title}
								slotRole={slot.role}
								sectionName={sectionName}
								sectionStartTime={sectionStartTime}
								sectionEndTime={sectionEndTime}
								inviteToken={slot.inviteToken}
							/>
						</div>
					) : slot.assignmentStatus === "active" ? (
						<div className="py-2 flex flex-col">
							<p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
								Activated & On Live Floor
							</p>
							<p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">
								{slot.staffName} successfully claimed their assignment.
							</p>
						</div>
					) : null}

					{slot.assignmentStatus === "active" || isPending ? (
						<div className="pt-1 flex flex-col gap-2">
							{confirmRevokeOpen ? (
								<Alert
									variant="destructive"
									className="border-red-500/20 bg-red-950/20 text-red-200 flex flex-col"
								>
									<AlertTitle>
										{isPending
											? `Remove ${slot.staffName} from this slot?`
											: `Revoke access for ${slot.staffName}?`}
									</AlertTitle>
									<AlertDescription>
										<p className="text-red-100 text-xs">
											{isPending
												? "Their invite link will stop working. This cannot be undone."
												: "This will instantly deactivate their live workspace and clear this role slot. This cannot be undone."}
										</p>
									</AlertDescription>
									<div className="col-span-2 flex flex-col sm:flex-row gap-2 mt-3">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setConfirmRevokeOpen(false)}
											disabled={revoking}
											className="text-zinc-400 hover:text-zinc-200"
										>
											Cancel
										</Button>
										<Button
											type="button"
											variant="destructive"
											onClick={handleRevoke}
											disabled={revoking}
											className="font-bold"
										>
											{revoking
												? isPending
													? "Removing…"
													: "Revoking…"
												: isPending
													? "Confirm Remove"
													: "Confirm Revoke"}
										</Button>
									</div>
								</Alert>
							) : (
								<>
									<Button
										type="button"
										variant="destructive"
										onClick={() => setConfirmRevokeOpen(true)}
										className="w-full border border-red-500/20 hover:bg-red-950/20 text-red-400 font-medium py-6 rounded-xl transition-colors"
									>
										{isPending
											? "Remove Assignment"
											: "Revoke Access & Remove Assignment"}
									</Button>
									<span className="text-xs text-red-200/80 font-medium italic text-center">
										{isPending
											? "Clears this slot and invalidates their invite link."
											: "Instantly revokes their token and locks out their device."}
									</span>
								</>
							)}
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function SlotRow({
	slot,
	section,
	accessToken,
}: {
	slot: StaffSlot;
	section: StaffSection;
	accessToken: string;
}) {
	const [dialog, setDialog] = useState<"assign" | "manage" | null>(null);

	const statusLabel =
		slot.assignmentStatus === "vacant"
			? "Unassigned"
			: slot.assignmentStatus === "pending"
				? "Pending"
				: "Active";

	return (
		<>
			<div className="flex items-center gap-2 py-2 border-b border-zinc-800 last:border-0">
				<div className="flex-1 min-w-0">
					<p className="text-sm text-zinc-200 truncate font-medium">
						{slot.title}
					</p>
					<p className="text-[10px] font-medium text-zinc-400">
						{slot.role.toUpperCase()}
						{slot.staffName ? ` · ${slot.staffName}` : ""} ·{" "}
						<span
							className={`${slot.assignmentStatus === "active" ? "text-green-500" : slot.assignmentStatus === "pending" ? "text-yellow-500" : "text-zinc-300"} font-semibold`}
						>
							{statusLabel}
						</span>
					</p>
				</div>
				{slot.assignmentStatus === "vacant" ? (
					<Button
						type="button"
						variant="link"
						size="sm"
						onClick={() => setDialog("assign")}
					>
						Assign
					</Button>
				) : (
					<Button
						type="button"
						variant="link"
						size="sm"
						onClick={() => setDialog("manage")}
					>
						Manage
					</Button>
				)}
			</div>

			{dialog === "assign" && (
				<AssignSlotDialog
					slot={slot}
					sectionName={section.name}
					sectionStartTime={section.startTime}
					sectionEndTime={section.endTime}
					accessToken={accessToken}
					open
					onOpenChange={(v) => !v && setDialog(null)}
				/>
			)}
			{dialog === "manage" && (
				<ManageSlotDialog
					slot={slot}
					sectionName={section.name}
					sectionStartTime={section.startTime}
					sectionEndTime={section.endTime}
					accessToken={accessToken}
					open
					onOpenChange={(v) => !v && setDialog(null)}
				/>
			)}
		</>
	);
}

export function AdminStaffManagement() {
	const accessToken = getStaffAccessToken();
	const { data: staffData } = useSuspenseQuery(
		convexQuery(api.liveStaff.getLiveFloorStaffManagement, { accessToken }),
	);

	if (!staffData) return null;

	return (
		<div className="shrink-0 px-1 pb-4 space-y-3">
			<div>
				<p className="text-md font-bold text-zinc-50">Staff Management</p>
				<p className="text-xs text-zinc-300">
					Assign roles and share invites by section.
				</p>
			</div>

			{staffData.sections.map((section) => (
				<div key={section.sectionKey} className="space-y-1">
					<div className="px-0.5 flex items-center gap-2 flex-row">
						<p className="text-[11px] font-bold uppercase text-zinc-400">
							{section.name}
						</p>
						{section.startTime && section.endTime ? (
							<p className="text-[11px] font-mono font-bold text-yellow-200">
								{formatTime12h(section.startTime)} –{" "}
								{formatTime12h(section.endTime)}
							</p>
						) : null}
					</div>
					<div className="rounded-lg bg-zinc-800/40 px-2.5">
						{section.slots.map((slot) => (
							<SlotRow
								key={slot.slotId}
								slot={slot}
								section={section}
								accessToken={accessToken}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
