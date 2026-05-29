import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { Camera, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Field, FieldContent, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import { getStaffAccessToken } from "#/lib/staffToken";
import { cn, formatFieldErrors } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ALERT_TYPES, MAX_ALERT_BODY_LENGTH } from "../../../convex/constants";

export function AlertPanel({ isQueueFull = false }: { isQueueFull?: boolean }) {
	const [alertType, setAlertType] = useState<string>(ALERT_TYPES[0]);
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createAlert = useMutation(api.alerts.createAlert);
	const generateUploadUrl = useMutation(api.alerts.generateAlertPhotoUploadUrl);

	const form = useForm({
		defaultValues: {
			body: "",
		},
		onSubmit: async ({ value }) => {
			if (isQueueFull) return;

			setIsSending(true);
			try {
				const photoId = await uploadPhoto();
				await createAlert({
					accessToken: getStaffAccessToken(),
					alertType,
					body: value.body.trim(),
					photoId,
				});
				toast.success("Alert sent!");
				form.reset();
				setAlertType(ALERT_TYPES[0]);
				clearPhoto();
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to send alert",
				);
			} finally {
				setIsSending(false);
			}
		},
	});

	const clearPhoto = () => {
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		setPhotoFile(null);
		setPhotoPreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handlePhotoSelect = (file: File | undefined) => {
		if (!file) return;
		clearPhoto();
		setPhotoFile(file);
		setPhotoPreview(URL.createObjectURL(file));
	};

	const uploadPhoto = async (): Promise<Id<"_storage"> | undefined> => {
		if (!photoFile) return undefined;

		const uploadUrl = await generateUploadUrl({
			accessToken: getStaffAccessToken(),
		});
		const response = await fetch(uploadUrl, {
			method: "POST",
			headers: { "Content-Type": photoFile.type },
			body: photoFile,
		});
		if (!response.ok) {
			throw new Error("Failed to upload photo.");
		}
		const { storageId } = (await response.json()) as {
			storageId: Id<"_storage">;
		};
		return storageId;
	};

	return (
		<div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md bg-zinc-800 backdrop-blur-2xl rounded-2xl p-3 shadow-2xl z-40 flex flex-col gap-3 border-[0.5px] border-zinc-300">
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

			{photoPreview && (
				<div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-600 shrink-0">
					<img
						src={photoPreview}
						alt="Alert attachment preview"
						className="w-full h-full object-cover"
					/>
					<button
						type="button"
						onClick={clearPhoto}
						className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-zinc-950/80 text-zinc-200"
						aria-label="Remove photo"
					>
						<X className="size-3" />
					</button>
				</div>
			)}

			<form
				noValidate
				className="flex items-end gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					capture="environment"
					className="hidden"
					onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
				/>
				<button
					type="button"
					disabled={isQueueFull || isSending}
					onClick={() => fileInputRef.current?.click()}
					className="rounded-xl p-3 shrink-0 border border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Attach photo"
				>
					<Camera className="size-4" />
				</button>

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
		</div>
	);
}
