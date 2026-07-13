import { format } from "date-fns";
import { toast } from "sonner";
import { eventDateFromMs, formatTime12h } from "#/lib/utils";

function formatTimeRange(startTime?: string, endTime?: string) {
	if (startTime && endTime) {
		return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
	}
	if (startTime) return formatTime12h(startTime);
	return null;
}

export function buildStaffInviteShareMessage({
	staffName,
	eventName,
	eventDate,
	roleTitle,
	sectionName,
	startTime,
	endTime,
	role = "staff",
	inviteUrl,
}: {
	staffName: string;
	eventName: string;
	eventDate: number;
	roleTitle: string;
	sectionName?: string;
	startTime?: string;
	endTime?: string;
	role?: "supervisor" | "staff";
	inviteUrl: string;
}) {
	const timeRange = formatTimeRange(startTime, endTime);
	const formattedDate = format(eventDateFromMs(eventDate), "PP");

	const body = [
		`Hello ${staffName.trim()},`,
		"",
		"You have been assigned to the following role:",
		"",
		`• Event: ${eventName}`,
		`• Role: ${roleTitle}`,
		...(sectionName ? [`• Section: ${sectionName}`] : []),
		`• Date: ${formattedDate}`,
		...(timeRange ? [`• Time: ${timeRange}`] : []),
		...(role === "supervisor" ? ["• Access level: Supervisor"] : []),
		"",
		"Please use the secure link below to claim your assignment. Event must go live in order to access your workspace.",
	];

	return [
		...body,
		"",
		inviteUrl,
		"",
		"Once entered, access is non transferable to another device or person. If you did not expect this assignment, please contact your event coordinator.",
	].join("\n");
}

async function copyTextToClipboard(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		textarea.style.left = "-9999px";
		document.body.appendChild(textarea);
		textarea.select();
		const copied = document.execCommand("copy");
		document.body.removeChild(textarea);
		return copied;
	}
}

function canUseNativeShare() {
	return (
		typeof navigator !== "undefined" &&
		typeof window !== "undefined" &&
		window.isSecureContext &&
		typeof navigator.share === "function"
	);
}

/** Copies the full invite, then opens the OS share sheet (WhatsApp, email, etc.). */
export async function shareStaffInvite(message: string, title: string) {
	const copied = await copyTextToClipboard(message);
	if (!copied) {
		toast.error("Could not copy invite message.");
		return;
	}

	if (!canUseNativeShare()) {
		toast.success("Invite copied. Paste into WhatsApp, email, or another app.");
		return;
	}

	try {
		const payload = { title, text: message };
		if (navigator.canShare && !navigator.canShare(payload)) {
			toast.success(
				"Invite copied. Paste into WhatsApp, email, or another app.",
			);
			return;
		}

		await navigator.share(payload);
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") return;
		toast.success("Invite copied. Paste into WhatsApp, email, or another app.");
	}
}
