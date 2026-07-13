import { useForm } from "@tanstack/react-form";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { tv } from "tailwind-variants";
import z from "zod";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import type { DemoWatchlistEntry } from "#/demo/types";
import { cn, formatFieldErrors, formatRelativeTime } from "#/lib/utils";
import { MAX_WATCHLIST_UPDATE_LENGTH } from "../../../convex/constants";

const KIND_LABELS: Record<DemoWatchlistEntry["kind"], string> = {
	banned_person: "Banned person",
	prohibited_item: "Prohibited item",
};

const watchlistStyles = tv({
	slots: {
		card: "bg-zinc-500/50 rounded-md overflow-hidden text-zinc-50",
	},
});

export function DemoWatchlistItem({
	entry,
	currentStaffId,
	expanded,
	onToggleExpand,
}: {
	entry: DemoWatchlistEntry;
	currentStaffId: string;
	expanded: boolean;
	onToggleExpand: () => void;
}) {
	const { addWatchlistUpdate } = useDemoFloor();
	const threadEndRef = useRef<HTMLDivElement>(null);
	const { card } = watchlistStyles();
	const latestUpdate = entry.updates[entry.updates.length - 1];
	const kindColor =
		entry.kind === "banned_person" ? "text-red-300" : "text-amber-300";

	useEffect(() => {
		if (!expanded || entry.updates.length === 0) return;
		threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [expanded, entry.updates.length]);

	const followUpForm = useForm({
		defaultValues: { content: "" },
		onSubmit: async ({ value }) => {
			addWatchlistUpdate(entry.id, value.content.trim());
			followUpForm.reset();
		},
	});

	const expandLabel = expanded
		? "Collapse watchlist thread"
		: "Expand watchlist thread";

	return (
		<div className={card()}>
			<button
				type="button"
				className="w-full text-left"
				onClick={onToggleExpand}
				aria-expanded={expanded}
				aria-label={expandLabel}
			>
				<div className="flex flex-row p-2 pb-0 gap-3 h-full">
					<div>
						{entry.photoUrl && (
							<span className="block w-20 h-20 rounded-md overflow-hidden border border-zinc-500">
								<img
									src={entry.photoUrl}
									alt={entry.label}
									className="w-full h-full object-cover"
								/>
							</span>
						)}
					</div>
					<div className="flex flex-col leading-tight min-w-0 flex-1">
						<span className={cn("text-[10px] font-bold uppercase", kindColor)}>
							{KIND_LABELS[entry.kind]}
						</span>
						<span className="font-semibold text-zinc-50 tracking-tight text-sm truncate">
							{entry.label}
						</span>
						{entry.notes && (
							<span className="text-zinc-300 text-xs mt-0.5">{entry.notes}</span>
						)}
					</div>

					<div className="flex flex-col items-stretch">
						<div className="flex flex-row items-center justify-end mt-auto">
							{expanded ? (
								<ChevronUp className="size-5 shrink-0 text-zinc-300" />
							) : (
								<ChevronDown className="size-5 shrink-0 text-zinc-300" />
							)}
						</div>
					</div>
				</div>
				<div className="px-2 py-1.5 space-y-2">
					{latestUpdate && (
						<div className="w-full text-left bg-zinc-800/50 rounded-md py-1 px-2">
							<span className="text-[10px] text-zinc-300 italic block">
								latest update:
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
				</div>
			</button>

			{expanded && (
				<div className="border-t border-zinc-600 bg-zinc-800 px-2 py-2 flex flex-col gap-2">
					{entry.updates.length === 0 ? (
						<p className="text-xs text-zinc-500">No updates yet.</p>
					) : (
						<div className="flex max-h-48 flex-col gap-1 overflow-y-auto py-1">
							{entry.updates.map((update) => {
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
									.min(1, "Message is required.")
									.max(
										MAX_WATCHLIST_UPDATE_LENGTH,
										`Message must be at most ${MAX_WATCHLIST_UPDATE_LENGTH} characters.`,
									),
							}}
						>
							{(field) => {
								const atLimit =
									field.state.value.length >= MAX_WATCHLIST_UPDATE_LENGTH;
								const hasErrors = field.state.meta.errors.length > 0;

								return (
									<Field className="min-w-0 flex-1">
										<FieldContent>
											<Textarea
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														e.target.value.slice(
															0,
															MAX_WATCHLIST_UPDATE_LENGTH,
														),
													)
												}
												maxLength={MAX_WATCHLIST_UPDATE_LENGTH}
												placeholder="Add update..."
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
													{field.state.value.length}/
													{MAX_WATCHLIST_UPDATE_LENGTH}
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
							aria-label="Send update"
						>
							<Send className="size-3.5" />
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
