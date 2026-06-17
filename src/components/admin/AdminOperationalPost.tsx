import { convexQuery } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "#/components/ui/button";
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

import {
	NativeSelect,
	NativeSelectOption,
} from "#/components/ui/native-select";
import { getStaffAccessToken } from "#/lib/staffToken";
import { capitalizeWords, formatFieldErrors, formatTime12h } from "#/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

function formatSectionOptionLabel(section: {
	name: string;
	startTime?: string;
	endTime?: string;
}) {
	const displayName = capitalizeWords(section.name);
	if (section.startTime && section.endTime) {
		return `${displayName} (${formatTime12h(section.startTime)} – ${formatTime12h(section.endTime)})`;
	}
	return displayName;
}

const operationalPostSchema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	sectionId: z.string().trim().min(1, "Section is required."),
	roleDescription: z
		.string()
		.trim()
		.min(1, "Role description is required.")
		.max(60, "Role description must be 60 characters or fewer."),
});

type AssignOperationalPostDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	accessToken: string;
	initialName?: string;
	initialSectionId?: Id<"eventSections">;
	initialRoleDescription?: string;
};

function AssignOperationalPostDialog({
	open,
	onOpenChange,
	accessToken,
	initialName,
	initialSectionId,
	initialRoleDescription,
}: AssignOperationalPostDialogProps) {
	const [loading, setLoading] = useState(false);
	const { data: sections } = useSuspenseQuery(
		convexQuery(api.liveStaff.getAdminEventSections, { accessToken }),
	);
	const setPost = useMutation(api.liveStaff.setAdminOperationalPost);

	const form = useForm({
		defaultValues: {
			name: initialName ?? "",
			sectionId: initialSectionId ?? "",
			roleDescription: initialRoleDescription ?? "",
		},
		onSubmit: async ({ value }) => {
			setLoading(true);
			try {
				await setPost({
					accessToken,
					sectionId: value.sectionId as Id<"eventSections">,
					staffName: value.name.trim(),
					operationalRoleTitle: value.roleDescription.trim(),
				});
				toast.success("Your post has been updated.");
				onOpenChange(false);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to update your post.",
				);
			} finally {
				setLoading(false);
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.setFieldValue("name", initialName ?? "");
			form.setFieldValue("sectionId", initialSectionId ?? "");
			form.setFieldValue("roleDescription", initialRoleDescription ?? "");
		} else {
			form.reset();
		}
	}, [open, initialName, initialSectionId, initialRoleDescription, form]);

	if (!sections) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md text-zinc-50">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">
						Assign yourself to a section
					</DialogTitle>
					<DialogDescription className="text-zinc-400">
						Tell others where you are covering on the floor.
					</DialogDescription>
				</DialogHeader>

				{sections.length === 0 ? (
					<p className="text-sm text-zinc-400">
						No sections configured for this event.
					</p>
				) : (
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
								onSubmit: operationalPostSchema.shape.name,
							}}
						>
							{(field) => {
								const hasErrors = field.state.meta.errors.length > 0;
								return (
									<Field>
										<FieldLabel
											htmlFor="operational-name"
											className="text-xs text-zinc-500"
										>
											Name
										</FieldLabel>
										<FieldContent>
											<Input
												id="operational-name"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="e.g. Alexis Chen"
												aria-invalid={hasErrors}
											/>
											{hasErrors ? (
												<FieldError>
													{formatFieldErrors(field.state.meta.errors)}
												</FieldError>
											) : null}
										</FieldContent>
									</Field>
								);
							}}
						</form.Field>

						<form.Field
							name="sectionId"
							validators={{
								onSubmit: operationalPostSchema.shape.sectionId,
							}}
						>
							{(field) => {
								const hasErrors = field.state.meta.errors.length > 0;
								return (
									<Field>
										<FieldLabel
											htmlFor="operational-section"
											className="text-xs text-zinc-500"
										>
											Section
										</FieldLabel>
										<FieldContent>
											<NativeSelect
												id="operational-section"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={hasErrors}
												className="w-full bg-zinc-950 border-zinc-800 text-zinc-100"
											>
												<NativeSelectOption value="">
													Select a section…
												</NativeSelectOption>
												{sections.map((section) => (
													<NativeSelectOption
														key={section._id}
														value={section._id}
													>
														{formatSectionOptionLabel(section)}
													</NativeSelectOption>
												))}
											</NativeSelect>
											{hasErrors ? (
												<FieldError>
													{formatFieldErrors(field.state.meta.errors)}
												</FieldError>
											) : null}
										</FieldContent>
									</Field>
								);
							}}
						</form.Field>

						<form.Field
							name="roleDescription"
							validators={{
								onSubmit: operationalPostSchema.shape.roleDescription,
							}}
						>
							{(field) => {
								const hasErrors = field.state.meta.errors.length > 0;
								return (
									<Field>
										<FieldLabel
											htmlFor="operational-role"
											className="text-xs text-zinc-500"
										>
											Role description
										</FieldLabel>
										<FieldContent>
											<Input
												id="operational-role"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="e.g. Entrance Attendant"
												aria-invalid={hasErrors}
												// className="bg-zinc-950 border-zinc-800 text-zinc-100"
											/>
											{hasErrors ? (
												<FieldError>
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
							disabled={loading}
							className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
						>
							{loading ? "Saving…" : "Save"}
						</Button>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

export function AdminOperationalPost() {
	const accessToken = getStaffAccessToken();
	const { data: profile } = useSuspenseQuery(
		convexQuery(api.liveStaff.getProfile, { accessToken }),
	);
	const setPost = useMutation(api.liveStaff.setAdminOperationalPost);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [clearing, setClearing] = useState(false);

	if (!profile?.isAdmin) return null;

	const hasPost = profile.hasOperationalPost === true;

	const handleClear = async () => {
		setClearing(true);
		try {
			await setPost({ accessToken, sectionId: null });
			toast.success("Returned to Event Control.");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to clear your post.",
			);
		} finally {
			setClearing(false);
		}
	};

	return (
		<div className="rounded-md  bg-zinc-700/80 p-3 space-y-3">
			<div>
				<p className="text-sm font-bold text-zinc-50">Your Own Assignment</p>
				<p className="text-xs text-zinc-50">
					Set for yourself where you are covering on the floor.
				</p>
			</div>

			{hasPost ? (
				<p className="text-sm text-zinc-200">
					<span className="font-semibold text-zinc-50">{profile.name}</span>
					{" · "}
					Covering{" "}
					<span className="font-semibold text-zinc-50">
						{capitalizeWords(profile.sectionName)}
					</span>
					{profile.sectionStartTime && profile.sectionEndTime ? (
						<span className="ml-1 text-xs font-mono text-yellow-200">
							{formatTime12h(profile.sectionStartTime)} –{" "}
							{formatTime12h(profile.sectionEndTime)}
						</span>
					) : null}
					{profile.operationalRoleTitle ? (
						<>
							{" "}
							as{" "}
							<span className="font-semibold text-yellow-200">
								{profile.operationalRoleTitle}
							</span>
						</>
					) : null}
				</p>
			) : null}

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					onClick={() => setDialogOpen(true)}
					// className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
					variant="default"
				>
					{hasPost ? "Change" : "Assign yourself to a section"}
				</Button>
				{hasPost ? (
					<Button
						type="button"
						size="sm"
						variant="destructive"
						disabled={clearing}
						onClick={() => void handleClear()}
						// className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
					>
						{clearing ? "Clearing…" : "Clear"}
					</Button>
				) : null}
			</div>

			<AssignOperationalPostDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				accessToken={accessToken}
				initialName={profile.name}
				initialSectionId={profile.sectionId}
				initialRoleDescription={profile.operationalRoleTitle ?? ""}
			/>
		</div>
	);
}
