import { useForm } from "@tanstack/react-form";
import { Send } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { CollapsibleBottomPanel } from "#/components/live/CollapsibleBottomPanel";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import { cn, formatFieldErrors } from "#/lib/utils";
import { ALERT_TYPES, MAX_ALERT_BODY_LENGTH } from "../../../convex/constants";

export function DemoAlertPanel({
	isQueueFull = false,
}: {
	isQueueFull?: boolean;
}) {
	const { createAlert } = useDemoFloor();
	const [alertType, setAlertType] = useState<string>(ALERT_TYPES[0]);
	const [isSending, setIsSending] = useState(false);

	const form = useForm({
		defaultValues: {
			body: "",
		},
		onSubmit: async ({ value }) => {
			if (isQueueFull) return;

			setIsSending(true);
			try {
				createAlert({
					alertType,
					body: value.body.trim(),
				});
				form.reset();
				setAlertType(ALERT_TYPES[0]);
			} finally {
				setIsSending(false);
			}
		},
	});

	return (
		<CollapsibleBottomPanel panelLabel="alert composer" defaultOpen>
			<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
				{ALERT_TYPES.map((tag) => (
					<button
						key={tag}
						type="button"
						onClick={() => setAlertType(tag)}
						className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors shrink-0 ${
							alertType === tag
								? "bg-zinc-200 text-zinc-950"
								: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
						}`}
					>
						{tag.replace("_", " ")}
					</button>
				))}
			</div>

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
					name="body"
					validators={{
						onSubmit: z
							.string()
							.trim()
							.min(1, "Message is required.")
							.max(
								MAX_ALERT_BODY_LENGTH,
								`Message must be at most ${MAX_ALERT_BODY_LENGTH} characters.`,
							),
					}}
				>
					{(field) => {
						const atLimit = field.state.value.length >= MAX_ALERT_BODY_LENGTH;
						const hasErrors = field.state.meta.errors.length > 0;

						return (
							<Field className="flex-1 min-w-0">
								<FieldContent>
									<Textarea
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(
												e.target.value.slice(0, MAX_ALERT_BODY_LENGTH),
											)
										}
										maxLength={MAX_ALERT_BODY_LENGTH}
										placeholder="Alert message..."
										rows={2}
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
											{field.state.value.length}/{MAX_ALERT_BODY_LENGTH}
										</span>
									</div>
								</FieldContent>
							</Field>
						);
					}}
				</form.Field>

				<button
					type="submit"
					disabled={isQueueFull || isSending}
					className={`rounded-xl p-3 transition-all flex items-center justify-center shrink-0 shadow-lg ${
						isQueueFull || isSending
							? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50 border border-zinc-700"
							: "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 active:scale-95"
					}`}
				>
					<Send className="size-4" />
				</button>
			</form>
		</CollapsibleBottomPanel>
	);
}
