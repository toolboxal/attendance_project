import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { CollapsibleBottomPanel } from "#/components/live/CollapsibleBottomPanel";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import { getStaffAccessToken } from "#/lib/staffToken";
import { cn, formatFieldErrors } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import { MAX_BROADCAST_LENGTH } from "../../../convex/constants";

export function BroadcastPanel() {
	const [isSending, setIsSending] = useState(false);
	const [isPanelOpen, setIsPanelOpen] = useState(false);

	const createBroadcast = useMutation(api.broadcasts.createBroadcast);

	const form = useForm({
		defaultValues: {
			content: "",
		},
		onSubmit: async ({ value }) => {
			setIsSending(true);
			try {
				await createBroadcast({
					accessToken: getStaffAccessToken(),
					content: value.content.trim(),
				});
				toast.success("Broadcast sent!");
				form.reset();
				setIsPanelOpen(false);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to send broadcast",
				);
			} finally {
				setIsSending(false);
			}
		},
	});

	return (
		<CollapsibleBottomPanel
			panelLabel="broadcast composer"
			open={isPanelOpen}
			onOpenChange={setIsPanelOpen}
		>
			<p className="text-sm font-medium text-zinc-300">
				Message all staff on the live floor
			</p>

			<form
				noValidate
				className="flex items-start gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
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
						const atLimit = field.state.value.length >= MAX_BROADCAST_LENGTH;
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
										className="min-h-0 resize-none bg-zinc-950 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-500 dark:bg-zinc-950"
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
					disabled={isSending}
					className={cn(
						"rounded-xl p-3 transition-all flex items-center justify-center shrink-0 shadow-lg",
						isSending
							? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50 border border-zinc-700"
							: "bg-zinc-50 hover:bg-zinc-200 text-zinc-950 active:scale-95",
					)}
				>
					<Send className="size-4" />
				</button>
			</form>
		</CollapsibleBottomPanel>
	);
}
