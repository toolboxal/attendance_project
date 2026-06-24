import { useQuery } from "convex/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Field,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { authClient } from "#/lib/auth-client";
import { api } from "../../../convex/_generated/api";

export function AccountSection() {
	const profile = useQuery(api.users.getAccountProfile);
	const { data: session } = authClient.useSession();
	const [name, setName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (profile) {
			setName(profile.name ?? "");
		}
	}, [profile]);

	const handleSave = async () => {
		const trimmed = name.trim();
		if (!trimmed) {
			toast.error("Display name is required");
			return;
		}
		if (trimmed.length > 80) {
			toast.error("Display name must be 80 characters or fewer");
			return;
		}

		setIsSaving(true);
		try {
			const { error } = await authClient.updateUser({ name: trimmed });
			if (error) {
				toast.error(error.message || "Failed to update display name");
				return;
			}
			toast.success("Display name updated");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update display name",
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (profile === undefined) {
		return (
			<Card className="bg-zinc-900/50 border-zinc-800 ring-zinc-800">
				<CardContent className="flex items-center justify-center py-10">
					<Spinner />
				</CardContent>
			</Card>
		);
	}

	const sessionEmail = session?.user?.email ?? profile.email;
	const memberSince = profile.createdAt
		? format(new Date(profile.createdAt), "MMMM d, yyyy")
		: null;

	return (
		<Card className="bg-zinc-900/50 border-zinc-800 ring-zinc-800 text-white">
			<CardHeader>
				<CardTitle>Account</CardTitle>
				<CardDescription className="text-zinc-400">
					Your sign-in identity and display name on the live floor.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<FieldGroup>
					<Field>
						<FieldLabel className="text-zinc-300">Email</FieldLabel>
						<Input
							value={sessionEmail}
							readOnly
							disabled
							className="bg-zinc-950 border-zinc-800 text-zinc-400"
						/>
					</Field>
					{memberSince ? (
						<p className="text-xs text-zinc-500">Member since {memberSince}</p>
					) : null}
				</FieldGroup>

				<FieldGroup>
					<Field>
						<FieldLabel className="text-zinc-300">Display name</FieldLabel>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="How staff see you on the floor"
							className="bg-zinc-950 border-zinc-800"
						/>
					</Field>
					<Button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="w-fit"
					>
						{isSaving ? "Saving..." : "Save name"}
					</Button>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}
