import { convexQuery } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import z from "zod";
import { Button } from "#/components/ui/button";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import { cn, formatFieldErrors } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MAX_BROADCAST_LENGTH } from "../../../convex/constants";

const sectionStyles = tv({
	slots: {
		card: "rounded-md p-2 space-y-2 bg-zinc-900 shadow-sm shadow-emerald-700",
	},
});

export function AdminBroadcastSection({
	accessToken,
}: {
	accessToken: string;
}) {
	const { card } = sectionStyles();
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [pendingId, setPendingId] = useState<Id<"broadcasts"> | null>(null);

	const { data: broadcast } = useSuspenseQuery(
		convexQuery(api.broadcasts.getEventBroadcast, { accessToken }),
	);

	const createBroadcast = useMutation(api.broadcasts.createBroadcast);
	const updateBroadcast = useMutation(api.broadcasts.updateBroadcast);
	const deactivateBroadcast = useMutation(api.broadcasts.deactivateBroadcast);
	const setActiveBroadcast = useMutation(api.broadcasts.setActiveBroadcast);
	const deleteBroadcast = useMutation(api.broadcasts.deleteBroadcast);

	const showComposer = broadcast === null || isEditing;

	const form = useForm({
		defaultValues: {
			content: broadcast?.content ?? "",
		},
		onSubmit: async ({ value }) => {
			setIsSaving(true);
			try {
				if (broadcast) {
					await updateBroadcast({
						accessToken,
						broadcastId: broadcast._id,
						content: value.content.trim(),
					});
					toast.success("Broadcast updated.");
					setIsEditing(false);
				} else {
					await createBroadcast({
						accessToken,
						content: value.content.trim(),
					});
					form.reset();
				}
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to save broadcast",
				);
			} finally {
				setIsSaving(false);
			}
		},
	});

	const handleCancelEdit = () => {
		setIsEditing(false);
		form.reset();
	};

	const handleDeactivate = async (broadcastId: Id<"broadcasts">) => {
		setPendingId(broadcastId);
		try {
			await deactivateBroadcast({ accessToken, broadcastId });
			toast.success("Broadcast deactivated.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to deactivate broadcast",
			);
		} finally {
			setPendingId(null);
		}
	};

	const handleSetActive = async (broadcastId: Id<"broadcasts">) => {
		setPendingId(broadcastId);
		try {
			await setActiveBroadcast({ accessToken, broadcastId });
			toast.success("Broadcast is now live.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to activate broadcast",
			);
		} finally {
			setPendingId(null);
		}
	};

	const handleDelete = async (broadcastId: Id<"broadcasts">) => {
		setPendingId(broadcastId);
		try {
			await deleteBroadcast({ accessToken, broadcastId });
			toast.success("Broadcast deleted.");
			setIsEditing(false);
			form.reset();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete broadcast",
			);
		} finally {
			setPendingId(null);
		}
	};

	return (
		<div className="space-y-2">
			<div className="flex flex-col px-0 pb-2 shrink-0">
				<p className="text-md font-bold text-zinc-50">Broadcast</p>
				<p className="text-xs text-zinc-300">
					Important announcement for everyone.
				</p>
			</div>

			{broadcast && !isEditing ? (
				<div className={card()}>
					<p className="text-sm text-zinc-100 italic whitespace-pre-wrap">
						{broadcast.content}
					</p>
					<div className="flex flex-row justify-between items-end">
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"text-[10px] font-bold uppercase p-0.5 rounded-full",
									broadcast.status === "active"
										? "text-yellow-400"
										: "text-zinc-300",
								)}
							>
								{broadcast.status === "active" ? "Broadcasting" : "Inactive"}
							</span>
							<span className="text-[10px] text-zinc-300">
								{format(broadcast.createdAt, "h:mm a")}
							</span>
						</div>
						<div className="flex flex-wrap gap-1">
							{broadcast.status === "active" ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={pendingId === broadcast._id}
									onClick={() => handleDeactivate(broadcast._id)}
									className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
								>
									Deactivate
								</Button>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={pendingId === broadcast._id}
									onClick={() => handleSetActive(broadcast._id)}
									className="border-yellow-600/40 text-yellow-400 hover:bg-yellow-900/30"
								>
									Show
								</Button>
							)}
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={pendingId === broadcast._id}
								onClick={() => {
									form.setFieldValue("content", broadcast.content);
									setIsEditing(true);
								}}
								className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
							>
								Edit
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={pendingId === broadcast._id}
								onClick={() => handleDelete(broadcast._id)}
								className="border-red-900/50 text-red-400 hover:bg-red-950/40"
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			) : null}

			{showComposer ? (
				<form
					noValidate
					className="flex flex-col gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div className="flex items-start gap-2">
						<form.Field
							name="content"
							validators={{
								onSubmit: z
									.string()
									.trim()
									.min(1, "Message is required.")
									.max(
										MAX_BROADCAST_LENGTH,
										`Message must be at most ${MAX_BROADCAST_LENGTH} characters.`,
									),
							}}
						>
							{(field) => {
								const atLimit =
									field.state.value.length >= MAX_BROADCAST_LENGTH;
								const hasErrors = field.state.meta.errors.length > 0;

								return (
									<Field className="flex-1 min-w-0">
										<FieldContent>
											<Textarea
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														e.target.value.slice(0, MAX_BROADCAST_LENGTH),
													)
												}
												maxLength={MAX_BROADCAST_LENGTH}
												placeholder="Broadcast message..."
												rows={3}
												aria-invalid={hasErrors}
												className="min-h-0 resize-none text-zinc-100 placeholder:text-zinc-500"
											/>
											<div className="flex flex-row items-start justify-between gap-2">
												{hasErrors ? (
													<FieldError className="text-[11px]">
														{formatFieldErrors(field.state.meta.errors)}
													</FieldError>
												) : (
													<span />
												)}
												<span
													className={cn(
														"text-[10px] shrink-0 tabular-nums",
														atLimit
															? "text-destructive font-medium"
															: "text-zinc-500",
													)}
												>
													{field.state.value.length}/{MAX_BROADCAST_LENGTH}
												</span>
											</div>
										</FieldContent>
									</Field>
								);
							}}
						</form.Field>

						<button
							type="submit"
							disabled={isSaving}
							className={cn(
								"rounded-xl p-3 transition-all flex items-center justify-center shrink-0 shadow-lg",
								isSaving
									? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50 border border-zinc-700"
									: "bg-zinc-50 hover:bg-zinc-200 text-zinc-950 active:scale-95",
							)}
						>
							<Send className="size-4" />
							<span className="sr-only">
								{broadcast ? "Save broadcast" : "Create broadcast"}
							</span>
						</button>
					</div>

					{isEditing ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isSaving}
							onClick={handleCancelEdit}
							className="w-fit border-zinc-600 text-zinc-300 hover:bg-zinc-700"
						>
							Cancel
						</Button>
					) : null}
				</form>
			) : null}
		</div>
	);
}
