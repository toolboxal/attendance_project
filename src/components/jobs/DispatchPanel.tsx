import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { Minus, Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { CollapsibleBottomPanel } from "#/components/live/CollapsibleBottomPanel";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { getStaffAccessToken } from "#/lib/staffToken";
import { cn, formatFieldErrors } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import { MAX_JOB_DESCRIPTION_LENGTH } from "../../../convex/constants";

export function DispatchPanel({
	isQueueFull = false,
}: {
	isQueueFull?: boolean;
}) {
	const [personCount, setPersonCount] = useState(1);
	const [requestType, setRequestType] = useState("regular");
	const [isSending, setIsSending] = useState(false);

	const dispatchJob = useMutation(api.jobs.dispatchJob);

	const form = useForm({
		defaultValues: {
			description: "",
		},
		onSubmit: async ({ value }) => {
			if (isQueueFull || personCount < 1) return;

			setIsSending(true);
			try {
				await dispatchJob({
					accessToken: getStaffAccessToken(),
					personCount,
					requestType,
					description: value.description.trim() || undefined,
				});
				toast.success("Job Dispatched!");
				form.reset();
				setPersonCount(1);
				setRequestType("regular");
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to dispatch",
				);
			} finally {
				setIsSending(false);
			}
		},
	});

	return (
		<CollapsibleBottomPanel panelLabel="dispatch composer">
			<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
				{["regular", "elderly", "family", "wheelchair", "vip"].map((tag) => (
					<button
						key={tag}
						type="button"
						onClick={() => setRequestType(tag)}
						className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors shrink-0 ${
							requestType === tag
								? "bg-zinc-200 text-zinc-950"
								: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
						}`}
					>
						{tag}
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
				<div className="flex items-center bg-zinc-950/50 rounded-xl overflow-hidden border border-zinc-800/80 shrink-0">
					<button
						type="button"
						onClick={() => setPersonCount(Math.max(1, personCount - 1))}
						className="px-3 py-2.5 text-zinc-400 hover:text-zinc-100 transition-colors"
					>
						<Minus className="size-4" />
					</button>
					<span className="w-5 text-center text-zinc-100 font-bold text-sm">
						{personCount}
					</span>
					<button
						type="button"
						onClick={() => setPersonCount(personCount + 1)}
						className="px-3 py-2.5 text-zinc-400 hover:text-zinc-100 transition-colors"
					>
						<Plus className="size-4" />
					</button>
				</div>

				<form.Field
					name="description"
					validators={{
						onSubmit: z
							.string()
							.max(
								MAX_JOB_DESCRIPTION_LENGTH,
								`Note must be at most ${MAX_JOB_DESCRIPTION_LENGTH} characters.`,
							),
					}}
				>
					{(field) => {
						const atLimit =
							field.state.value.length >= MAX_JOB_DESCRIPTION_LENGTH;
						const hasErrors = field.state.meta.errors.length > 0;

						return (
							<Field className="flex-1 min-w-0">
								<FieldContent>
									<Input
										type="text"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(
												e.target.value.slice(0, MAX_JOB_DESCRIPTION_LENGTH),
											)
										}
										maxLength={MAX_JOB_DESCRIPTION_LENGTH}
										placeholder="Short note..."
										aria-invalid={hasErrors}
										className="bg-zinc-950 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-500 dark:bg-zinc-950"
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
											{field.state.value.length}/{MAX_JOB_DESCRIPTION_LENGTH}
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
