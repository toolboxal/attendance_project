import { useForm } from "@tanstack/react-form";
import { ChevronDown, ChevronUp, Pin, PinOff, Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { tv } from "tailwind-variants";
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

const alertStyles = tv({
	slots: {
		card: "bg-zinc-500/50 rounded-md overflow-hidden text-zinc-50",
	},
	variants: {
		pinned: {
			true: {
				card: "overflow-hidden ring-1 ring-red-500",
			},
		},
	},
});

export function DemoAlertItem({
	alert,
	currentStaffId,
	isSupervisor,
	expanded,
	onToggleExpand,
}: {
	alert: DemoAlert;
	currentStaffId: string;
	isSupervisor: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
}) {
	const { addAlertUpdate, resolveAlert, setAlertPinned } = useDemoFloor();
	const threadEndRef = useRef<HTMLDivElement>(null);
	const { card } = alertStyles({ pinned: alert.isPinned });

	const isCreator = alert.creatorId === currentStaffId;
	const canResolve = isCreator || isSupervisor;
	const canPin = isSupervisor;
	const latestUpdate = alert.updates[alert.updates.length - 1];

	useEffect(() => {
		if (!expanded || alert.updates.length === 0) return;
		threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [expanded, alert.updates.length]);

	const followUpForm = useForm({
		defaultValues: {
			content: "",
		},
		onSubmit: async ({ value }) => {
			addAlertUpdate(alert.id, value.content.trim());
			followUpForm.reset();
		},
	});

	const expandLabel = expanded
		? "Collapse alert thread"
		: "Expand alert thread";

	return (
		<div className={card()}>
			<div className="flex flex-row items-stretch border-b border-zinc-600">
				<button
					type="button"
					className="min-w-0 flex-1 text-left px-2 py-0.5"
					onClick={onToggleExpand}
					aria-expanded={expanded}
					aria-label={expandLabel}
				>
					<div className="flex flex-col leading-tight">
						<div className="flex flex-row items-center gap-2">
							<span className="font-medium text-zinc-50 tracking-tight text-sm truncate">
								{capitalizeWords(alert.sectionName ?? "Event")}
							</span>
							{alert.isPinned && (
								<span className="text-[10px] font-bold text-amber-400 uppercase shrink-0">
									Pinned
								</span>
							)}
						</div>
						<span className="font-medium text-zinc-300 text-xs">
							{alert.creatorRoleTitle}
						</span>
						<div className="flex flex-row items-center gap-1">
							<span
								className={`font-medium text-[11px] italic ${isCreator ? "text-yellow-400 font-semibold" : "text-zinc-300"}`}
							>
								{alert.creatorName}
							</span>
							<span
								className={`font-medium text-[11px] italic ${isCreator ? "text-yellow-400 font-semibold" : "text-zinc-300"}`}
							>
								{formatStaffRoleLabel(alert.creatorRole)}
							</span>
							{isCreator && (
								<span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
							)}
						</div>
					</div>
				</button>

				<div className="flex shrink-0 flex-col gap-1 self-stretch px-2 py-0.5">
					<div className="mt-auto flex flex-row items-center justify-end gap-1.5 pb-0.5">
						{canPin && (
							<button
								type="button"
								onClick={() => setAlertPinned(alert.id, !alert.isPinned)}
								className="flex items-center gap-1 rounded-sm bg-zinc-800 p-1 px-2 text-xs font-medium text-zinc-200"
							>
								{alert.isPinned ? (
									<PinOff className="size-3" />
								) : (
									<Pin className="size-3" />
								)}
								{alert.isPinned ? "Unpin" : "Pin"}
							</button>
						)}
						{canResolve && (
							<button
								type="button"
								onClick={() => resolveAlert(alert.id)}
								className="rounded-sm bg-zinc-200 p-1 px-2 text-xs font-medium text-zinc-950"
							>
								Resolve
							</button>
						)}
					</div>
				</div>
			</div>

			<button
				type="button"
				className="w-full text-left pb-2 px-2"
				onClick={onToggleExpand}
				tabIndex={-1}
				aria-hidden
			>
				<div className="flex flex-row gap-2 items-start">
					<div className="flex flex-col leading-tight pt-1.5">
						<span className="text-[11px] font-bold text-red-400 uppercase">
							{alert.alertType.replace("_", " ")}
						</span>
						<p className="text-sm text-red-100 font-medium">{alert.body}</p>
						<p className="text-[11px] text-zinc-400 italic">
							{formatRelativeTime(alert.createdAt)}
						</p>
					</div>
				</div>
				<div className="flex flex-row items-center justify-end mt-auto">
					{expanded ? (
						<ChevronUp className="mt-auto size-5 shrink-0 text-zinc-300" />
					) : (
						<ChevronDown className="mt-auto size-5 shrink-0 text-zinc-300" />
					)}
				</div>
				{latestUpdate && (
					<div className="w-full text-left bg-zinc-800/50 rounded-md py-1 px-2">
						<span className="text-[10px] text-zinc-300 italic block">
							latest reply:
						</span>
						<span className="text-zinc-100 text-xs block line-clamp-1">
							{latestUpdate.content}
						</span>

						<div className="text-[11px] text-zinc-100 px-0.5 flex flex-row justify-between items-center gap-1">
							<span className="font-medium text-zinc-400 block">
								{latestUpdate.authorName}
							</span>
							<span className="text-zinc-400 italic block">
								{formatRelativeTime(latestUpdate.createdAt)}
							</span>
						</div>
					</div>
				)}
			</button>

			{expanded && (
				<div className=" bg-zinc-800 px-2 py-2 flex flex-col gap-2">
					{alert.updates.length === 0 ? (
						<p className="text-xs text-zinc-500">No follow-ups yet.</p>
					) : (
						<div className="flex max-h-48 flex-col gap-1 overflow-y-auto py-1">
							{alert.updates.map((update) => {
								const isOwn = update.authorId === currentStaffId;

								return (
									<div
										key={update.id}
										className={cn(
											"flex w-fit flex-col",
											isOwn ? "items-end self-end" : "items-start self-start",
										)}
									>
										<div
											className={cn(
												"rounded-lg px-2.5 py-1.5 text-xs shadow-sm",
												isOwn
													? "bg-emerald-800 text-zinc-50 shadow-emerald-500/50"
													: "bg-zinc-600 text-zinc-50 shadow-zinc-300/50",
											)}
										>
											<p className="leading-tight">{update.content}</p>
											<div className="flex flex-row items-center justify-between gap-2">
												<span
													className={cn(
														"text-[10px] font-medium",
														isOwn ? "text-emerald-400" : "text-zinc-300",
													)}
												>
													{update.authorName}
												</span>
												<span
													className={cn(
														"text-right text-[10px]",
														isOwn ? "text-emerald-200/80" : "text-zinc-300",
													)}
												>
													{formatRelativeTime(update.createdAt)}
												</span>
											</div>
										</div>
									</div>
								);
							})}
							<div ref={threadEndRef} aria-hidden />
						</div>
					)}

					<form
						noValidate
						className="flex items-start gap-1.5 pt-1"
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
									.min(1, "Follow-up is required.")
									.max(
										MAX_ALERT_UPDATE_LENGTH,
										`Follow-up must be at most ${MAX_ALERT_UPDATE_LENGTH} characters.`,
									),
							}}
						>
							{(field) => {
								const atLimit =
									field.state.value.length >= MAX_ALERT_UPDATE_LENGTH;
								const hasErrors = field.state.meta.errors.length > 0;

								return (
									<Field className="min-w-0 flex-1">
										<FieldContent>
											<Textarea
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														e.target.value.slice(0, MAX_ALERT_UPDATE_LENGTH),
													)
												}
												maxLength={MAX_ALERT_UPDATE_LENGTH}
												placeholder="Add follow-up..."
												rows={1}
												aria-invalid={hasErrors}
												className="min-h-0 resize-none border-zinc-700 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 dark:bg-zinc-950"
											/>
											<div className="flex flex-row items-start justify-between gap-2">
												{hasErrors ? (
													<FieldError className="text-[10px]">
														{formatFieldErrors(field.state.meta.errors)}
													</FieldError>
												) : (
													<span />
												)}
												<span
													className={cn(
														"shrink-0 text-[10px] tabular-nums",
														atLimit
															? "font-medium text-destructive"
															: "text-zinc-500",
													)}
												>
													{field.state.value.length}/{MAX_ALERT_UPDATE_LENGTH}
												</span>
											</div>
										</FieldContent>
									</Field>
								);
							}}
						</followUpForm.Field>
						<button
							type="submit"
							className="shrink-0 rounded-lg bg-zinc-200 p-1.5 text-zinc-950"
							aria-label="Send follow-up"
						>
							<Send className="size-3.5" />
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
