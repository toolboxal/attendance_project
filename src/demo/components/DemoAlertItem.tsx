import { useForm } from "@tanstack/react-form";
import { ChevronDown, ChevronUp, Pin, Send } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import type { DemoAlert } from "#/demo/types";
import {
	capitalizeWords,
	cn,
	formatFieldErrors,
	formatRelativeTime,
	formatStaffRoleLabel,
} from "#/lib/utils";
import { MAX_ALERT_UPDATE_LENGTH } from "../../../convex/constants";

export function DemoAlertItem({
	alert,
	currentStaffId,
}: {
	alert: DemoAlert;
	currentStaffId: string;
}) {
	const { addAlertUpdate, resolveAlert } = useDemoFloor();
	const [expanded, setExpanded] = useState(false);
	const isCreator = alert.creatorId === currentStaffId;

	const followUpForm = useForm({
		defaultValues: {
			content: "",
		},
		onSubmit: async ({ value }) => {
			addAlertUpdate(alert.id, value.content.trim());
			followUpForm.reset();
		},
	});

	return (
		<div
			className={cn(
				"rounded-md overflow-hidden text-zinc-50 bg-zinc-500/50",
				alert.isPinned && "ring-1 ring-red-500",
			)}
		>
			<button
				type="button"
				onClick={() => setExpanded((open) => !open)}
				className="w-full text-left px-2 py-2"
			>
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							{alert.isPinned ? (
								<Pin className="size-3 text-red-400 shrink-0" />
							) : null}
							<span className="text-[10px] font-bold uppercase tracking-wider text-yellow-200">
								{alert.alertType.replace("_", " ")}
							</span>
						</div>
						<p className="text-sm font-medium mt-1">{alert.body}</p>
						<p className="text-[11px] text-zinc-300 mt-1">
							{capitalizeWords(alert.sectionName ?? "Floor")} ·{" "}
							{alert.creatorRoleTitle} · {alert.creatorName}{" "}
							{formatStaffRoleLabel(alert.creatorRole)}
						</p>
					</div>
					<div className="flex flex-col items-end gap-1 shrink-0">
						<span className="text-[10px] text-zinc-400">
							{formatRelativeTime(alert.createdAt)}
						</span>
						{expanded ? (
							<ChevronUp className="size-4 text-zinc-400" />
						) : (
							<ChevronDown className="size-4 text-zinc-400" />
						)}
					</div>
				</div>
			</button>

			{expanded ? (
				<div className="border-t border-zinc-600/50 px-2 py-2 space-y-2">
					{alert.updates.length > 0 ? (
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{alert.updates.map((update) => (
								<div
									key={update.id}
									className="rounded-md bg-zinc-900/60 px-2 py-1.5"
								>
									<p className="text-[11px] text-zinc-300">
										<span className="font-semibold text-zinc-100">
											{update.authorName}
										</span>{" "}
										{formatStaffRoleLabel(update.authorRole)}
									</p>
									<p className="text-sm text-zinc-100 mt-0.5">
										{update.content}
									</p>
									<p className="text-[10px] text-zinc-500 mt-1">
										{formatRelativeTime(update.createdAt)}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="text-xs text-zinc-400 italic">No updates yet.</p>
					)}

					<form
						className="flex items-start gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							followUpForm.handleSubmit();
						}}
					>
						<followUpForm.Field
							name="content"
							validators={{
								onSubmit: z
									.string()
									.trim()
									.min(1, "Update is required.")
									.max(
										MAX_ALERT_UPDATE_LENGTH,
										`Update must be at most ${MAX_ALERT_UPDATE_LENGTH} characters.`,
									),
							}}
						>
							{(field) => (
								<Field className="flex-1 min-w-0">
									<FieldContent>
										<Textarea
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Add update..."
											rows={2}
											className="min-h-0 resize-none bg-zinc-950 border-zinc-700 text-zinc-100"
										/>
										{field.state.meta.errors.length > 0 ? (
											<FieldError className="text-[11px]">
												{formatFieldErrors(field.state.meta.errors)}
											</FieldError>
										) : null}
									</FieldContent>
								</Field>
							)}
						</followUpForm.Field>
						<button
							type="submit"
							className="rounded-lg bg-zinc-200 p-2 text-zinc-950 shrink-0"
						>
							<Send className="size-4" />
						</button>
					</form>

					{(isCreator || currentStaffId) && (
						<button
							type="button"
							onClick={() => resolveAlert(alert.id)}
							className="w-full rounded-md bg-emerald-700/80 py-1.5 text-xs font-semibold text-emerald-50"
						>
							Resolve alert
						</button>
					)}
				</div>
			) : null}
		</div>
	);
}
