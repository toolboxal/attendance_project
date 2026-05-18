import { useForm } from "@tanstack/react-form";
import { useBlocker } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronDownIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { tv } from "tailwind-variants";
import { toast } from "sonner";
import z from "zod";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Textarea } from "#/components/ui/textarea";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";

const formStyle = tv({
	slots: {
		sectionHeader: "text-xl font-semibold text-zinc-100",
		inputStyle: "px-3 py-6 text-base",
	},
});

function capitalizeWords(str: string) {
	if (!str) return "";
	return str
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export type JobScope = {
	id: string;
	section: string;
	role: "staff" | "supervisor";
	startTime: string;
	endTime: string;
	title: string;
	description: string;
};

// Define the cleaned data object structure submitted to the parent
export type EventSubmitData = {
	title: string;
	location: string;
	description?: string;
	eventDate: number;
	startTime: string;
	activeJobLimit?: number;
	sections: Array<{ name: string; startTime: string; endTime: string }>;
	jobScopes: Array<JobScope>;
};

type EventEditorProps = {
	mode?: "create" | "edit";
	initialData?: {
		title: string;
		location: string;
		description?: string;
		eventDate: number; // unix ms
		startTime: string;
		activeJobLimit?: number;
		sections: Array<{ name: string; startTime: string; endTime: string }>;
		jobScopes: Array<JobScope>;
	};
	onSubmit: (data: EventSubmitData) => Promise<void>;
};

export function EventEditor({
	mode = "create",
	initialData,
	onSubmit,
}: EventEditorProps) {
	// 🚨 SECURITY OVERRIDE: Prevents blocker when navigating away intentionally upon success
	const isNavigationAllowedRef = useRef(false);

	const [open, setOpen] = useState(false);
	const [sections, setSections] = useState<
		Array<{ name: string; startTime: string; endTime: string }>
	>(initialData?.sections ?? []);
	const [sectionInput, setSectionInput] = useState("");
	const [jobRole, setJobRole] = useState<"staff" | "supervisor">("staff");
	const [duplicateRoles, setDuplicateRoles] = useState(1);

	const [jobScopes, setJobScopes] = useState<Array<JobScope>>(
		initialData?.jobScopes ?? [],
	);
	const [selectedSection, setSelectedSection] = useState<string>(
		initialData?.sections?.[0]
			? `${initialData.sections[0].name}|${initialData.sections[0].startTime}|${initialData.sections[0].endTime}`
			: "",
	);
	const [startTime, setStartTime] = useState("08:00");
	const [endTime, setEndTime] = useState("12:00");
	const [jobTitle, setJobTitle] = useState("");
	const [jobDescription, setJobDescription] = useState("");

	const form = useForm({
		defaultValues: {
			title: initialData?.title ?? "",
			location: initialData?.location ?? "",
			description: initialData?.description ?? "",
			date: initialData?.eventDate
				? new Date(initialData.eventDate)
				: new Date(),
			time: initialData?.startTime ?? "10:30:00",
			activeJobLimit: initialData?.activeJobLimit ?? 15,
		},
		onSubmit: async ({ value }) => {
			// 1. Unlock the gate PROACTIVELY before firing the network call,
			// since successful completion will instantly trigger the navigation!
			isNavigationAllowedRef.current = true;

			try {
				// Hand execution power to the parent wrapper (Create Route or Edit Route)
				await onSubmit({
					title: value.title,
					location: value.location,
					description: value.description || undefined,
					eventDate: value.date.getTime(),
					startTime: value.time,
					activeJobLimit: value.activeJobLimit,
					sections: sections,
					jobScopes: jobScopes.map((job) => ({
						id: job.id, // 🚀 Crucial: Retain IDs to enable non-destructive differential updates!
						section: job.section,
						role: job.role,
						startTime: job.startTime,
						endTime: job.endTime,
						title: job.title,
						description: job.description,
					})),
				});
			} catch (error) {
				// 2. RELOCK the gate if it failed, so the user stays protected!
				isNavigationAllowedRef.current = false;
				throw error;
			}
		},
	});

	// 🚀 SORT & GROUPING LOGIC FOR DISPLAY
	const sortedJobScopes = [...jobScopes].sort((a, b) => {
		const startTimeCompare = a.startTime.localeCompare(b.startTime);
		if (startTimeCompare !== 0) return startTimeCompare;
		const endTimeCompare = a.endTime.localeCompare(b.endTime);
		if (endTimeCompare !== 0) return endTimeCompare;
		return a.section.localeCompare(b.section);
	});

	const groupedByTime = sortedJobScopes.reduce(
		(acc, job) => {
			const timeKey = `${job.startTime} - ${job.endTime}`;
			if (!acc[timeKey]) acc[timeKey] = {};
			if (!acc[timeKey][job.section]) acc[timeKey][job.section] = [];
			acc[timeKey][job.section].push(job);
			return acc;
		},
		{} as Record<string, Record<string, JobScope[]>>,
	);

	const isFormDirty =
		form.state.isDirty ||
		sections.length !== (initialData?.sections?.length ?? 0) ||
		jobScopes.length !== (initialData?.jobScopes?.length ?? 0);

	// 🛡️ Protection: Route changes within the app
	useBlocker({
		shouldBlockFn: () => {
			if (isNavigationAllowedRef.current) return false;
			if (!isFormDirty) return false;
			return !window.confirm(
				"You have unsaved changes. Are you sure you want to leave?",
			);
		},
	});

	// 🛡️ Protection: Browser reloads/closings
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isNavigationAllowedRef.current) return;
			if (isFormDirty) {
				e.preventDefault();
				e.returnValue = true;
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isFormDirty]);

	useEffect(() => {
		if (sections.length > 0 && !selectedSection) {
			const sec = sections[0];
			setSelectedSection(`${sec.name}|${sec.startTime}|${sec.endTime}`);
		}
	}, [sections, selectedSection]);

	const { sectionHeader, inputStyle } = formStyle();

	const handleAddSection = (e?: React.FormEvent) => {
		e?.preventDefault();
		const rawName = sectionInput.trim();
		if (!rawName) return;

		// Enforce strict lowercasing for absolute bulletproof comparisons and db storage!
		const finalName = rawName.toLowerCase();

		// Use Functional Updater to guarantee serial execution and lock out race conditions!
		setSections((prev) => {
			const exists = prev.some(
				(s) =>
					s.name === finalName &&
					s.startTime === startTime &&
					s.endTime === endTime,
			);
			if (exists) return prev; // Safely abort if already present in current state!

			return [
				...prev,
				{
					name: finalName,
					startTime: startTime,
					endTime: endTime,
				},
			];
		});

		setSectionInput("");
	};
	// console.log(sections);
	const handleRemoveSection = (
		targetName: string,
		start: string,
		end: string,
	) => {
		// 🚨 SAFETY LOCK: Prevent orphaning existing job scopes!
		const hasAttachedJobs = jobScopes.some(
			(job) =>
				job.section === targetName &&
				job.startTime === start &&
				job.endTime === end,
		);

		if (hasAttachedJobs) {
			toast.error("Unable to delete.", {
				description: `There is at least one job scope attached to this section. Remove them first before deleting this section.`,
			});
			return; // Hard exit - abort deletion!
		}

		// Use composite lock to only remove the ONE specific iteration!
		setSections((prev) =>
			prev.filter(
				(s) =>
					!(
						s.name === targetName &&
						s.startTime === start &&
						s.endTime === end
					),
			),
		);
	};

	const handleAddJobScope = (count: number) => {
		if (!jobTitle.trim() || !selectedSection) return;

		// Parse the composite section selection to extract target values
		const [targetName, targetStart, targetEnd] = selectedSection.split("|");

		const newJobs: JobScope[] = [];
		for (let i = 0; i < count; i++) {
			newJobs.push({
				// 🛡️ FIX: Do NOT use crypto.randomUUID() here as it crashes on insecure IP testing!
				id:
					Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
				section: targetName,
				role: jobRole,
				startTime: targetStart,
				endTime: targetEnd,
				title: jobTitle.trim(),
				description: jobDescription.trim(),
			});
		}
		setJobScopes((prev) => [...prev, ...newJobs]);
		setJobTitle("");
		setJobDescription("");
		setDuplicateRoles(1);
	};

	const handleRemoveJobScope = (id: string) => {
		setJobScopes((prev) => prev.filter((job) => job.id !== id));
	};

	return (
		<div className="w-full min-h-dvh">
			<section className="spine min-h-screen py-12 bg-zinc-950">
				<form
					noValidate
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div className="max-w-3xl mx-auto bg-zinc-800/20 rounded-lg md:p-12 p-3 border border-zinc-800/50 flex flex-col gap-6">
						<h2 className={sectionHeader()}>
							{mode === "create"
								? "Create a New Draft Event"
								: "Edit Event Configuration"}
						</h2>
						<FieldGroup>
							<form.Field
								name="title"
								validators={{
									onSubmit: z.string().nonempty("Please enter an event title"),
								}}
							>
								{(field) => (
									<Field>
										<FieldLabel htmlFor="event-title">Event Title</FieldLabel>
										<Input
											id="event-title"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className={inputStyle()}
										/>
										{field.state.meta.errors.length > 0 ? (
											<FieldDescription className="text-red-500">
												<em>
													{field.state.meta.errors
														.map((err: any) =>
															typeof err === "string"
																? err
																: err?.message ||
																	err?.issue?.message ||
																	"Invalid input",
														)
														.join(", ")}
												</em>
											</FieldDescription>
										) : (
											<FieldDescription>
												The name of your event as it will appear to your
												helpers.
											</FieldDescription>
										)}
									</Field>
								)}
							</form.Field>
							<form.Field
								name="location"
								validators={{
									onSubmit: z
										.string()
										.nonempty("Please enter an event location"),
								}}
							>
								{(field) => (
									<Field>
										<FieldLabel htmlFor="event-location">Location</FieldLabel>
										<Input
											id="event-location"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className={inputStyle()}
										/>
										{field.state.meta.errors.length > 0 ? (
											<FieldDescription className="text-red-500">
												<em>
													{field.state.meta.errors
														.map((err: any) =>
															typeof err === "string"
																? err
																: err?.message ||
																	err?.issue?.message ||
																	"Invalid input",
														)
														.join(", ")}
												</em>
											</FieldDescription>
										) : (
											<FieldDescription>
												The physical venue/address of the event.
											</FieldDescription>
										)}
									</Field>
								)}
							</form.Field>
							<form.Field
								name="description"
								validators={{
									onChange: z
										.string()
										.max(300, "Description cannot exceed 300 characters"),
								}}
							>
								{(field) => (
									<Field>
										<FieldLabel htmlFor="event-description">
											Description (optional)
										</FieldLabel>
										<Textarea
											id="event-description"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="min-h-24 p-3"
											placeholder="Notes, rules, guidelines, etc."
										/>
										{field.state.meta.errors.length > 0 ? (
											<FieldDescription className="text-red-500">
												<em>
													{field.state.meta.errors
														.map((err: any) =>
															typeof err === "string"
																? err
																: err?.message ||
																	err?.issue?.message ||
																	"Invalid input",
														)
														.join(", ")}
												</em>
											</FieldDescription>
										) : (
											<FieldDescription className="text-yellow-500/80 text-xs">
												Do not put sensitive info here. This is seen on public
												invite to helpers.
											</FieldDescription>
										)}
									</Field>
								)}
							</form.Field>
							
							<form.Field name="activeJobLimit">
								{(field) => (
									<Field className="max-w-md mt-2">
										<div className="flex flex-row justify-between items-center mb-2">
											<FieldLabel htmlFor="active-job-limit">
												Max Active Jobs Running At A Time
											</FieldLabel>
											<span className="text-sm font-bold text-zinc-400 font-mono">
												{field.state.value || 15} Max
											</span>
										</div>
										<div className="flex items-center gap-4">
											<Slider
												id="active-job-limit"
												value={[field.state.value || 15]}
												onValueChange={(val) => field.handleChange(val[0])}
												min={10}
												max={30}
												step={1}
												className="flex-1"
											/>
										</div>
										<FieldDescription>
											Set the work-in-progress limit for unresolved jobs on the event floor.
										</FieldDescription>
									</Field>
								)}
							</form.Field>
						</FieldGroup>

						<FieldGroup className="max-w-xs flex-row">
							<form.Field name="date">
								{(field) => (
									<Field>
										<FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
										<Popover open={open} onOpenChange={setOpen}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													type="button"
													id="date-picker-optional"
													className="w-32 justify-between font-normal"
												>
													{field.state.value
														? format(field.state.value, "PPP")
														: "Select date"}
													<ChevronDownIcon />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto overflow-hidden p-0"
												align="start"
											>
												<Calendar
													mode="single"
													selected={field.state.value}
													captionLayout="dropdown"
													defaultMonth={field.state.value}
													onSelect={(date) => {
														if (date) {
															field.handleChange(date);
															setOpen(false);
														}
													}}
												/>
											</PopoverContent>
										</Popover>
									</Field>
								)}
							</form.Field>
							<form.Field name="time">
								{(field) => (
									<Field className="w-32">
										<FieldLabel htmlFor="time-picker-optional">
											Start Time
										</FieldLabel>
										<Input
											type="time"
											id="time-picker-optional"
											step="1"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
										/>
									</Field>
								)}
							</form.Field>
						</FieldGroup>
						<FieldSeparator />
						{/* Sections */}
						<div className=" flex flex-col gap-6">
							<div>
								<h2 className={sectionHeader()}>Event Sections & Shifts</h2>
								<p className="text-sm text-zinc-400 mt-1">
									Define the specific areas, doors, or zones where your helpers
									will be stationed.
								</p>
							</div>
							<div className="flex flex-row gap-6 flex-wrap">
								<Field className="w-32">
									<FieldLabel htmlFor="duty-start-time">Shift Start</FieldLabel>
									<Input
										type="time"
										id="duty-start-time"
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
										className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
									/>
								</Field>
								<Field className="w-32">
									<FieldLabel htmlFor="duty-end-time">Shift End</FieldLabel>
									<Input
										type="time"
										id="duty-end-time"
										value={endTime}
										onChange={(e) => setEndTime(e.target.value)}
										className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
									/>
								</Field>
							</div>
							<Field>
								<FieldLabel htmlFor="section-input">Add New Section</FieldLabel>
								<InputGroup className="h-12 border-zinc-800 bg-zinc-950/40 focus-within:border-zinc-700 rounded-lg">
									<InputGroupInput
										id="section-input"
										placeholder="e.g. Main Lobby, Section A, Door 1..."
										value={sectionInput}
										onChange={(e) => setSectionInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddSection();
											}
										}}
										className="text-base py-0 h-full placeholder:text-zinc-700"
									/>
									<InputGroupAddon align="inline-end">
										<InputGroupButton
											variant="secondary"
											type="button"
											onClick={() => handleAddSection()}
											className=" px-3 py-4 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
										>
											Add
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
							</Field>

							<div className="space-y-3">
								<h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
									Active Sections ({sections.length})
								</h3>
								{sections.length === 0 ? (
									<div className="p-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/20 text-center flex flex-col items-center">
										<p className="text-sm text-zinc-400">
											No sections added yet.
										</p>
									</div>
								) : (
									<div className="flex flex-wrap gap-2 rounded-lg min-h-12 items-center">
										{sections.map((section) => (
											<div
												key={`${section.name}|${section.startTime}|${section.endTime}`}
												className="group flex items-center gap-1.5 bg-zinc-50 hover:bg-yellow-850 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-200 transition-all shadow-sm"
											>
												<div className="flex flex-col leading-tight">
													<span className="font-medium text-zinc-950 text-md">
														{capitalizeWords(section.name)}
													</span>
													<span className="text-[10px] text-zinc-500 font-mono">
														{section.startTime} - {section.endTime}
													</span>
												</div>
												<button
													type="button"
													onClick={() =>
														handleRemoveSection(
															section.name,
															section.startTime,
															section.endTime,
														)
													}
													className="text-zinc-500 hover:text-zinc-100 p-0.5 rounded-full hover:bg-zinc-800 transition-colors ml-2"
												>
													<XIcon className="h-3 w-3" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
						<FieldSeparator />
						{/* Job scopes */}
						{sections.length > 0 && (
							<div className=" flex flex-col gap-6">
								<div>
									<h2 className={sectionHeader()}>Add Job Scopes</h2>
									<p className="text-sm text-zinc-400 mt-1">
										Create job scopes that will be assigned to your helpers.
									</p>
								</div>
								<div className="p-3 rounded-lg border gap-6 border-zinc-800 bg-zinc-950/20 flex flex-col">
									<div className="flex flex-row gap-6">
										<div className="flex-1">
											<Field>
												<FieldLabel htmlFor="section-select">
													Select Section
												</FieldLabel>
												<NativeSelect
													value={selectedSection}
													onChange={(e) => setSelectedSection(e.target.value)}
												>
													{sections.map((section) => (
														<NativeSelectOption
															key={`${section.name}|${section.startTime}|${section.endTime}`}
															value={`${section.name}|${section.startTime}|${section.endTime}`}
														>
															{capitalizeWords(section.name)} (
															{section.startTime} - {section.endTime})
														</NativeSelectOption>
													))}
												</NativeSelect>
											</Field>
										</div>
										<div className="shrink-0">
											<Field>
												<FieldLabel htmlFor="role-access">
													Role Access
												</FieldLabel>
												<ToggleGroup
													type="single"
													variant="default"
													spacing={2}
													value={jobRole}
													onValueChange={(value) => {
														if (value)
															setJobRole(value as "staff" | "supervisor");
													}}
												>
													<ToggleGroupItem
														value="staff"
														className="transition-all duration-200 ease-in-out text-zinc-400 hover:text-zinc-100 data-[state=on]:bg-zinc-50 data-[state=on]:text-zinc-950"
													>
														Staff
													</ToggleGroupItem>
													<ToggleGroupItem
														value="supervisor"
														className="transition-all duration-200 ease-in-out text-zinc-400 hover:text-zinc-100 data-[state=on]:bg-zinc-50 data-[state=on]:text-zinc-950"
													>
														Supervisor
													</ToggleGroupItem>
												</ToggleGroup>
											</Field>
										</div>
									</div>

									<Field>
										<FieldLabel>Job Title</FieldLabel>
										<Input
											value={jobTitle}
											onChange={(e) => setJobTitle(e.target.value)}
											className={`${inputStyle()} placeholder:text-zinc-700`}
											placeholder="e.g. Foyer Usher, VIP Registrar, Gate 1 Scanner..."
										/>
										<FieldDescription>
											The title of this position for helper reference.
										</FieldDescription>
									</Field>
									<Field>
										<FieldLabel>Job Description</FieldLabel>
										<Input
											value={jobDescription}
											onChange={(e) => setJobDescription(e.target.value)}
											className={`${inputStyle()} placeholder:text-zinc-700`}
											placeholder="Specific instructions for the staff..."
										/>
									</Field>
									<div className="flex flex-row gap-6 flex-wrap">
										<Field className="w-40">
											<FieldLabel>Duplicate Count</FieldLabel>
											<ButtonGroup>
												<Button
													variant="outline"
													type="button"
													size="icon"
													className="h-8 w-8"
													onClick={() =>
														setDuplicateRoles((prev) => Math.max(1, prev - 1))
													}
												>
													<MinusIcon className="h-4 w-4" />
												</Button>
												<Input
													type="text"
													className="w-16 h-8 text-center bg-background"
													value={duplicateRoles}
													readOnly
												/>
												<Button
													variant="outline"
													type="button"
													size="icon"
													className="h-8 w-8"
													onClick={() =>
														setDuplicateRoles((prev) => Math.min(20, prev + 1))
													}
												>
													<PlusIcon className="h-4 w-4" />
												</Button>
											</ButtonGroup>
										</Field>
										<Button
											variant="default"
											type="button"
											onClick={() => handleAddJobScope(duplicateRoles)}
											className="min-w-fit w-1/4 self-end"
											size={"lg"}
											disabled={!jobTitle.trim()}
										>
											Create Job Scope
										</Button>
									</div>
								</div>

								{jobScopes.length > 0 && (
									<h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-50 mt-2">
										{jobScopes.length} Job Scopes Added /{" "}
										<span className="text-zinc-50">Max 50</span>
									</h3>
								)}

								<div className="flex flex-col gap-6">
									{Object.entries(groupedByTime).map(
										([timeRange, sectionsMap]) => (
											<div key={timeRange} className="flex flex-col gap-4">
												<div className="flex items-center gap-3 pb-2 mt-2">
													<h3 className="text-md font-bold text-yellow-200 flex items-center gap-2">
														{timeRange}
													</h3>
													<span className="text-zinc-600 text-xs font-mono">
														Shift Window
													</span>
												</div>
												{Object.entries(sectionsMap).map(
													([sectionName, jobs]) => (
														<div
															key={sectionName}
															className="flex flex-col gap-2"
														>
															<div className="flex items-center justify-center mb-2">
																<h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider ">
																	{capitalizeWords(sectionName)}
																</h4>
															</div>
															<div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/20">
																<Table>
																	<TableBody>
																		{jobs.map((job) => (
																			<TableRow
																				key={job.id}
																				className="border-zinc-800/50 hover:bg-zinc-800/20"
																			>
																				<TableCell>
																					<span
																						className={`text-[9px] font-bold px-2 py-1 rounded border ${
																							job.role === "supervisor"
																								? "bg-indigo-700/30 text-white border-indigo-800/50"
																								: "bg-zinc-800 text-zinc-300 border-zinc-700"
																						} uppercase tracking-widest`}
																					>
																						{job.role}
																					</span>
																				</TableCell>
																				<TableCell className="font-medium text-zinc-200 py-3">
																					{job.title}
																				</TableCell>
																				<TableCell className="text-zinc-400 text-xs hidden md:table-cell italic">
																					{job.description || "—"}
																				</TableCell>
																				<TableCell className="text-right">
																					<button
																						type="button"
																						onClick={() =>
																							handleRemoveJobScope(job.id)
																						}
																						className="text-zinc-600 hover:text-red-400 p-2 transition-colors rounded-md hover:bg-red-400/10"
																					>
																						<XIcon className="h-4 w-4" />
																					</button>
																				</TableCell>
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
															</div>
														</div>
													),
												)}
											</div>
										),
									)}
								</div>
							</div>
						)}

						<Button
							type="submit"
							disabled={form.state.isSubmitting}
							className="w-fit self-end mt-4"
							size={"lg"}
						>
							{form.state.isSubmitting
								? "Submitting..."
								: mode === "create"
									? "Create Event"
									: "Save Changes"}
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
}
