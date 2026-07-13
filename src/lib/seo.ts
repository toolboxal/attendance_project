export const SITE_URL =
	(import.meta.env.VITE_SITE_URL as string | undefined) ??
	"https://www.asistir.online";

export const SITE_NAME = "Asistir";

export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
export const OG_IMAGE_WIDTH = "300";
export const OG_IMAGE_HEIGHT = "300";

export const DEFAULT_DESCRIPTION =
	"Asistir helps event staff coordinate guest flow on the live floor — structured jobs, alerts, and roster in real time.";

export const LANDING_TITLE =
	"Asistir — Live floor guest flow for event staff";

export const LANDING_DESCRIPTION =
	"Replace noisy group chats with structured coordination. Asistir helps up to 50 staff direct attendees to the right place — in real time.";

/** Shared Open Graph / Twitter image tags for link previews (WhatsApp, etc.). */
export const OG_IMAGE_META = [
	{ property: "og:image", content: OG_IMAGE_URL },
	{ property: "og:image:width", content: OG_IMAGE_WIDTH },
	{ property: "og:image:height", content: OG_IMAGE_HEIGHT },
	{ property: "og:image:type", content: "image/png" },
	{ name: "twitter:image", content: OG_IMAGE_URL },
] as const;
