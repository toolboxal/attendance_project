import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ChevronDown, ChevronUp, Pin, PinOff, Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import z from "zod";
import { MAX_ALERT_UPDATE_LENGTH } from "../../../convex/constants";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import type { AlertReadMap } from "#/lib/alertReadState";
import { getUnreadUpdateCount } from "#/lib/alertReadState";
import { getStaffAccessToken } from "#/lib/staffToken";
import {
	capitalizeWords,
	cn,
	formatFieldErrors,
	formatRelativeTime,
} from "#/lib/utils";

type EnrichedAlert = FunctionReturnType<
	typeof api.alerts.getActiveAlerts
>[number];

const alertStyles = tv({
	slots: {
		card: "bg-zinc-700 rounded-md overflow-hidden text-zinc-50 shadow-sm shadow-zinc-400",
	},
	variants: {
		pinned: {
			true: {
				card: "bg-zinc-700 rounded-md overflow-hidden text-zinc-50 ring-2 ring-red-800",
			},
		},
	},
});

export function AlertItem({
	alert,
	currentStaffId,
	expanded,
	onToggleExpand,
	readMap,
	onMarkSeen,
}: {
	alert: EnrichedAlert;
	currentStaffId?: Id<"liveStaff">;
	expanded: boolean;
	onToggleExpand: () => void;
	readMap: AlertReadMap;
	onMarkSeen: (alertId: Id<"alerts">, updateCount: number) => void;
}) {
	const threadEndRef = useRef<HTMLDivElement>(null);

	const { card } = alertStyles({ pinned: alert.isPinned });

	const unreadUpdateCount = getUnreadUpdateCount(
		alert.updateCount,
		alert._id,
		readMap,
	);

	useEffect(() => {
		if (!expanded) return;
		onMarkSeen(alert._id, alert.updateCount);
	}, [expanded, alert.updateCount, alert._id, onMarkSeen]);

	const thread = useQuery(
		api.alerts.getAlertUpdates,
		expanded
			? { accessToken: getStaffAccessToken(), alertId: alert._id }
			: "skip",
	);

	useEffect(() => {
		if (!expanded || !thread?.length) return;
		threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [expanded, thread]);

	const addAlertUpdate = useMutation(api.alerts.addAlertUpdate);
	const resolveAlert = useMutation(api.alerts.resolveAlert);
	const setAlertPinned = useMutation(api.alerts.setAlertPinned);

	const followUpForm = useForm({
		defaultValues: {
			content: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await addAlertUpdate({
					alertId: alert._id,
					content: value.content.trim(),
					accessToken: getStaffAccessToken(),
				});
				followUpForm.reset();
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to send update",
				);
			}
		},
	});

	const isCreator = alert.creatorId === currentStaffId;

	const handleResolve = async () => {
		try {
			await resolveAlert({
				alertId: alert._id,
				accessToken: getStaffAccessToken(),
			});
			toast.success("Alert resolved");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to resolve");
		}
	};

	const handlePin = async () => {
		try {
			await setAlertPinned({
				alertId: alert._id,
				pinned: !alert.isPinned,
				accessToken: getStaffAccessToken(),
			});
			toast.success(alert.isPinned ? "Unpinned" : "Pinned");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to update pin");
		}
	};

	const expandLabel =
		unreadUpdateCount > 0
			? `${expanded ? "Collapse" : "Expand"} alert thread, ${unreadUpdateCount} unread updates`
			: expanded
				? "Collapse alert thread"
				: "Expand alert thread";

	return (
		<div className={card()}>
			<button
				type="button"
				className="w-full text-left"
				onClick={onToggleExpand}
				aria-expanded={expanded}
				aria-label={expandLabel}
			>
				<div className="flex flex-row items-start justify-between px-2 py-0.5 border-b border-zinc-600">
					<div className="flex flex-col leading-tight">
						<div className="flex flex-row items-center gap-2">
							<span className="text-sm font-bold text-red-300 uppercase">
								{alert.alertType.replace("_", " ")}
							</span>
							{alert.isPinned && (
								<span className="text-[10px] font-bold text-amber-400 uppercase">
									Pinned
								</span>
							)}
						</div>
						<span className="font-medium text-zinc-50 tracking-tight text-sm truncate">
							{capitalizeWords(alert.sectionName ?? "Event")}
						</span>
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
								{alert.creatorRole}
							</span>
							{isCreator && (
								<span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
							)}
						</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1 self-stretch pb-0.5 ">
						{unreadUpdateCount > 0 && (
							<div className="flex flex-row items-start justify-center gap-1 pt-0.5">
								<span className="text-[9px] font-medium italic text-zinc-50 leading-tight text-right">
									new
									<br />
									messages
								</span>
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-zinc-50">
									{unreadUpdateCount}
								</span>
							</div>
						)}

						<div className="flex flex-row items-center justify-end gap-1.5 pb-0.5 mt-auto">
							{alert.canPin && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handlePin();
									}}
									className="p-1 px-2 bg-zinc-800 text-zinc-200 text-xs font-medium rounded-sm flex items-center gap-1"
								>
									{alert.isPinned ? (
										<PinOff className="size-3" />
									) : (
										<Pin className="size-3" />
									)}
									{alert.isPinned ? "Unpin" : "Pin"}
								</button>
							)}
							{alert.canResolve && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleResolve();
									}}
									className="p-1 px-2 bg-zinc-200 text-zinc-950 text-xs font-medium rounded-sm"
								>
									Resolve
								</button>
							)}
						</div>
					</div>
				</div>

				<div className="px-2 py-1.5 space-y-2">
					{alert.photoUrl && (
						<a
							href={alert.photoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="block w-16 h-16 rounded-md ml-0.5 overflow-hidden border border-zinc-500"
							onClick={(e) => e.stopPropagation()}
						>
							<img
								src={alert.photoUrl}
								alt="Alert attachment"
								className="w-full h-full object-cover"
							/>
						</a>
					)}
					<div className="flex flex-row items-center justify-between">
						<div className="flex flex-col leading-tight">
							<p className="text-sm text-red-300 font-semibold">{alert.body}</p>
							<p className="ml-0.5 text-[11px] text-zinc-400 italic">
								{formatRelativeTime(alert._creationTime)}
							</p>
						</div>
						{expanded ? (
							<ChevronUp className="mt-auto size-5 shrink-0 text-zinc-300" />
						) : (
							<ChevronDown className="mt-auto size-5 shrink-0 text-zinc-300" />
						)}
					</div>
					{alert.latestUpdate && (
						<div className="w-full text-left bg-zinc-800/50 rounded-md py-1 px-2">
							<span className="text-[10px] text-zinc-300 italic block">
								latest reply:
							</span>
							<span className="text-zinc-100 text-xs block line-clamp-1">
								{alert.latestUpdate.content}
							</span>

							<div className="text-[11px] text-zinc-100 px-0.5 flex flex-row justify-between items-center gap-1">
								<span className="font-medium text-zinc-400 block">
									{alert.latestUpdate.authorName}
								</span>
								<span className="text-zinc-400 italic block">
									{formatRelativeTime(alert.latestUpdate.createdAt)}
								</span>
							</div>
						</div>
					)}
				</div>
			</button>

			{expanded && (
				<div className="border-t border-zinc-600 bg-zinc-800 px-2 py-2 flex flex-col gap-2">
					{thread === undefined ? (
						<p className="text-xs text-zinc-500">Loading updates…</p>
					) : thread.length === 0 ? (
						<p className="text-xs text-zinc-500">No follow-ups yet.</p>
					) : (
						<div className="flex max-h-48 flex-col gap-1 overflow-y-auto py-1">
							{thread.map((update) => {
								const isOwn = update.authorId === currentStaffId;

								return (
									<div
										key={update._id}
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
