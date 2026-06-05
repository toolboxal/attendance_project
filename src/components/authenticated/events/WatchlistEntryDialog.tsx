import { useMutation } from "convex/react";
import { Camera, Plus, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
	MAX_WATCHLIST_LABEL_LENGTH,
	MAX_WATCHLIST_NOTES_LENGTH,
	type WatchlistKind,
} from "../../../../convex/constants";

const KIND_OPTIONS: { value: WatchlistKind; label: string }[] = [
	{ value: "banned_person", label: "Banned person" },
	{ value: "prohibited_item", label: "Prohibited item" },
];

export function WatchlistEntryDialog({
	eventId,
	children,
	disabled = false,
}: {
	eventId: Id<"events">;
	children: ReactNode;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [kind, setKind] = useState<WatchlistKind>("banned_person");
	const [label, setLabel] = useState("");
	const [notes, setNotes] = useState("");
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createEntry = useMutation(api.watchlist.create);
	const generateUploadUrl = useMutation(
		api.watchlist.generateWatchlistPhotoUploadUrl,
	);

	const resetForm = () => {
		setKind("banned_person");
		setLabel("");
		setNotes("");
		clearPhoto();
	};

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

		const uploadUrl = await generateUploadUrl({ eventId });
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!label.trim()) {
			toast.error("Label is required.");
			return;
		}
		if (kind === "banned_person" && !photoFile) {
			toast.error("A photo is required for banned person entries.");
			return;
		}

		setIsSubmitting(true);
		try {
			const photoId = await uploadPhoto();
			await createEntry({
				eventId,
				kind,
				label: label.trim(),
				notes: notes.trim() || undefined,
				photoId,
			});
			toast.success("Watchlist entry added.");
			resetForm();
			setOpen(false);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create entry.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const photoRequired = kind === "banned_person";

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) resetForm();
			}}
		>
			<DialogTrigger asChild disabled={disabled}>
				{children}
			</DialogTrigger>
			<DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100">
				<DialogHeader>
					<DialogTitle className="text-zinc-50">
						Add watchlist entry
					</DialogTitle>
					<DialogDescription className="text-zinc-400">
						Operational use only. Staffs on the live floor will see this entry
						on the Watchlist tab.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="watchlist-kind">Type</Label>
						<Select
							value={kind}
							onValueChange={(value) => setKind(value as WatchlistKind)}
						>
							<SelectTrigger
								id="watchlist-kind"
								className="w-full bg-zinc-950 border-zinc-700"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="bg-zinc-900 border-zinc-700">
								{KIND_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="watchlist-label">
							{kind === "banned_person"
								? "Name or identifier"
								: "Item description"}
						</Label>
						<Input
							id="watchlist-label"
							value={label}
							onChange={(e) =>
								setLabel(e.target.value.slice(0, MAX_WATCHLIST_LABEL_LENGTH))
							}
							maxLength={MAX_WATCHLIST_LABEL_LENGTH}
							placeholder={
								kind === "banned_person" ? "e.g. John D." : "e.g. Glass bottles"
							}
							className="bg-zinc-950 border-zinc-700"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="watchlist-notes">Notes (optional)</Label>
						<Textarea
							id="watchlist-notes"
							value={notes}
							onChange={(e) =>
								setNotes(e.target.value.slice(0, MAX_WATCHLIST_NOTES_LENGTH))
							}
							maxLength={MAX_WATCHLIST_NOTES_LENGTH}
							rows={3}
							placeholder="Context for helpers (where last seen, clothing, etc.)"
							className="bg-zinc-950 border-zinc-700 resize-none"
						/>
					</div>

					<div className="space-y-2">
						<Label>Photo{photoRequired ? " (required)" : " (optional)"}</Label>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
						/>
						<div className="flex items-center gap-3">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="border-zinc-700"
								onClick={() => fileInputRef.current?.click()}
							>
								<Camera className="size-4 mr-1" />
								{photoFile ? "Change photo" : "Upload photo"}
							</Button>
							{photoPreview && (
								<div className="relative size-16 rounded-lg overflow-hidden border border-zinc-600">
									<img
										src={photoPreview}
										alt="Preview"
										className="size-full object-cover"
									/>
									<button
										type="button"
										onClick={clearPhoto}
										className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-zinc-950/80"
										aria-label="Remove photo"
									>
										<X className="size-3" />
									</button>
								</div>
							)}
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setOpen(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							<Plus className="size-4 mr-1" />
							{isSubmitting ? "Saving…" : "Add entry"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
