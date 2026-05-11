import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	useBlocker,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { ChevronDownIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
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
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "../../../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/app/events/create")({
	component: RouteComponent,
});

const formStyle = tv({
	slots: {
		sectionHeader: "text-xl font-semibold text-zinc-100",
		inputStyle: "px-3 py-6 text-base",
	},
});

type JobScope = {
	id: string;
	section: string;
	role: "staff" | "supervisor";
	startTime: string;
	endTime: string;
	title: string;
	description: string;
};

function RouteComponent() {
	const navigate = useNavigate();
	const createEvent = useMutation(api.events.create);

	// 🚨 SECURITY OVERRIDE: Used to tell the router NOT to trigger blockers when we navigate away intentionally!
	const isNavigationAllowedRef = useRef(false);

	const [open, setOpen] = useState(false);
	const [sections, setSections] = useState<string[]>([]);
	const [sectionInput, setSectionInput] = useState("");
	const [jobRole, setJobRole] = useState<"staff" | "supervisor">("staff");
	const [duplicateRoles, setDuplicateRoles] = useState(1);

	const [jobScopes, setJobScopes] = useState<Array<JobScope>>([]);
	const [selectedSection, setSelectedSection] = useState("");
	const [startTime, setStartTime] = useState("08:00");
	const [endTime, setEndTime] = useState("12:00");
	const [jobTitle, setJobTitle] = useState("");
	const [jobDescription, setJobDescription] = useState("");

	const form = useForm({
		defaultValues: {
			title: "",
			location: "",
			description: "",
			date: new Date(),
			time: "10:30:00",
		},
		onSubmit: async ({ value }) => {
			try {
				await createEvent({
					title: value.title,
					location: value.location,
					description: value.description || undefined,
					eventDate: value.date.getTime(), // Convert Date to timestamp
					startTime: value.time,
					sections: sections,
					// Map job scopes into the precise structure the server demands
					jobScopes: jobScopes.map((job) => ({
						section: job.section,
						role: job.role,
						startTime: job.startTime,
						endTime: job.endTime,
						title: job.title,
						description: job.description,
					})),
				});

				// 🟢 GREEN LIGHT: The event was saved successfully, so lift all traffic gates!
				isNavigationAllowedRef.current = true;

				toast.success("Event Draft Saved Successfully!");

				// 🔥 ESSENTIAL: Reset ALL local states back to pristine so the Blockers don't lock our navigation!
				setSections([]);
				setJobScopes([]);
				form.reset();

				// Beam the user to the master event list view
				navigate({ to: "/app/events" });
			} catch (error: any) {
				console.error("Event creation failed:", error);
				// Intelligently handle that 'Insufficient Credits' message we just built!
				toast.error(
					error?.message || "Failed to create event. Please try again.",
				);
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

	// Aggregate dirtiness across standard state + TanStack Form
	const isFormDirty =
		form.state.isDirty || sections.length > 0 || jobScopes.length > 0;

	// 🛡️ Protection: Route changes within the app
	useBlocker({
		shouldBlockFn: () => {
			// If we just successfully saved the form, definitely DO NOT block navigation!
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
			// If we are leaving due to a successful form submit, don't trigger the popup
			if (isNavigationAllowedRef.current) return;

			if (isFormDirty) {
				e.preventDefault();
				e.returnValue = true; // Legacy requirement for browsers
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isFormDirty]);

	useEffect(() => {
		if (sections.length > 0 && !selectedSection) {
			setSelectedSection(sections[0]);
		}
	}, [sections, selectedSection]);

	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);
	useEffect(() => {
		setPageHeader({
			title: "Create Event",
			showBackButton: true,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader]);

	const { sectionHeader, inputStyle } = formStyle();

	// Adds a section, verifying duplicates and empty text
	const handleAddSection = (e?: React.InputEvent) => {
		e?.preventDefault();
		const trimmed = sectionInput.trim();
		if (!trimmed) return;
		if (sections.includes(trimmed)) {
			// You can trigger a toast notification here
			return;
		}
		setSections([...sections, trimmed]);
		setSectionInput(""); // Reset input
	};
	// Removes a section
	const handleRemoveSection = (sectionToRemove: string) => {
		setSections(sections.filter((s) => s !== sectionToRemove));
	};

	const handleAddJobScope = (count: number) => {
		if (!jobTitle.trim() || !selectedSection) return;
		const newJobs: JobScope[] = []; // 1️⃣ Create a temporary array
		for (let i = 0; i < count; i++) {
			newJobs.push({
				id: crypto.randomUUID(),
				section: selectedSection,
				role: jobRole,
				startTime,
				endTime,
				title: jobTitle.trim(),
				description: jobDescription.trim(),
			});
		}
		// 2️⃣ Save all new roles to state in a single batch operation
		setJobScopes((prev) => [...prev, ...newJobs]);
		// Reset inputs
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
						<h2 className={sectionHeader()}>Create a New Draft Event</h2>
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
							<form.Field name="description">
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
										/>
										<FieldDescription>
											Notes, rules, guidelines, etc.
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
										<FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
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
								<h2 className={sectionHeader()}>Event Sections & Spaces</h2>
								<p className="text-sm text-zinc-400 mt-1">
									Define the specific areas, doors, or zones where your helpers
									will be stationed.
								</p>
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
											onClick={() => handleAddSection()}
											className=" px-3 py-4 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
										>
											{/* <PlusIcon className="h-4 w-4" /> */}
											Add
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
							</Field>
							{/* Display Added Sections */}
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
									// Wrapping Tag Grid
									<div className="flex flex-wrap gap-2 rounded-lg min-h-12 items-center">
										{sections.map((section) => (
											<div
												key={section}
												className="group flex items-center gap-1.5 bg-zinc-50 hover:bg-yellow-850 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-200 transition-all shadow-sm"
											>
												<span className="font-medium text-zinc-950 text-md">
													{section
														.split(" ")
														.map((word, index) =>
															index === 0
																? word.charAt(0).toUpperCase() + word.slice(1)
																: word,
														)
														.join(" ")}
												</span>
												<button
													type="button"
													onClick={() => handleRemoveSection(section)}
													className="text-zinc-500 hover:text-zinc-100 p-0.5 rounded-full hover:bg-zinc-800 transition-colors"
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
								{sections.length > 0 && (
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
															<NativeSelectOption key={section} value={section}>
																{section}
															</NativeSelectOption>
														))}
													</NativeSelect>
												</Field>
											</div>
											<div className="shrink-0">
												<Field>
													<FieldLabel htmlFor="section-select">
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
										<div className="flex flex-row gap-6 flex-wrap">
											<Field className="w-32">
												<FieldLabel htmlFor="duty-start-time">
													Duty Start Time
												</FieldLabel>
												<Input
													type="time"
													id="duty-start-time"
													value={startTime}
													onChange={(e) => setStartTime(e.target.value)}
													className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
												/>
											</Field>
											<Field className="w-32">
												<FieldLabel htmlFor="duty-end-time">
													Duty End Time
												</FieldLabel>
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
											<FieldLabel>Job Title</FieldLabel>
											<Input
												value={jobTitle}
												onChange={(e) => setJobTitle(e.target.value)}
												className={`${inputStyle()} placeholder:text-zinc-700`}
												placeholder="e.g. Foyer Usher, VIP Registrar, Gate 1 Scanner..."
											/>
											<FieldDescription>
												The title of this specific position as it will appear on
												the helper's active pass.
											</FieldDescription>
										</Field>
										<Field>
											<FieldLabel>Job Description</FieldLabel>
											<Input
												value={jobDescription}
												onChange={(e) => setJobDescription(e.target.value)}
												className={`${inputStyle()} placeholder:text-zinc-700`}
												placeholder="e.g. Scan barcodes, direct guests to Section A, report entry queue backlogs..."
											/>
											<FieldDescription>
												Specific instructions for the staff assigned to this
												role.
											</FieldDescription>
										</Field>
										<div className="flex flex-row gap-6 flex-wrap">
											<Field className="w-40">
												<FieldLabel>Duplicate No. of Roles</FieldLabel>
												<ButtonGroup>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														onClick={() => {
															if (duplicateRoles > 1)
																setDuplicateRoles((prev) => prev - 1);
															else setDuplicateRoles(1);
														}}
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
														size="icon"
														className="h-8 w-8"
														onClick={() => {
															if (duplicateRoles < 20)
																setDuplicateRoles((prev) => prev + 1);
														}}
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
								)}
								{/* Display Added Job Scopes */}
								{jobScopes.length > 0 && (
									<h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-50 mt-2">
										{jobScopes.length} Job Scopes Added /{" "}
										<span className="text-zinc-50">Max 50</span>
									</h3>
								)}

								{/* Display Grouped Job Scopes */}
								<div className="flex flex-col gap-6">
									{Object.entries(groupedByTime).map(
										([timeRange, sectionsMap]) => (
											<div key={timeRange} className="flex flex-col gap-4">
												{/* Top-level Header: Time Span */}
												<div className="flex items-center gap-3  pb-2 mt-2">
													<h3 className="text-md font-bold text-yellow-200 flex items-center gap-2">
														{/* <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 animate-pulse" /> */}
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
															{/* Secondary-level Header: The Section */}
															<div className="flex items-center justify-center mb-2">
																<h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider ">
																	{sectionName}
																</h4>
															</div>

															{/* The clean data table for items fitting this context */}
															<div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/20">
																<Table>
																	{/* <TableHeader>
																	<TableRow className="hover:bg-transparent bg-zinc-900/20 border-zinc-800">
																		<TableHead className="w-24 py-3 font-bold text-zinc-500 text-[10px] uppercase">
																			Access Role
																		</TableHead>
																		<TableHead className="py-3 font-bold text-zinc-500 text-[10px] uppercase">
																			Scope/Position Name
																		</TableHead>
																		<TableHead className="hidden md:table-cell py-3 font-bold text-zinc-500 text-[10px] uppercase">
																			Specific Duties
																		</TableHead>
																		<TableHead className="w-12" />
																	</TableRow>
																</TableHeader> */}
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
																						title="Delete Role"
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
							{form.state.isSubmitting ? "Submitting..." : "Create Event"}
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
}
