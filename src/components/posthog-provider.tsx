import { PostHogProvider } from "@posthog/react";
import type { ReactNode } from "react";
import { PostHogIdentify } from "#/components/posthog-identify";

const apiKey = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
const host =
	import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com";

export function AppPostHogProvider({ children }: { children: ReactNode }) {
	if (!apiKey) return children;

	return (
		<PostHogProvider
			apiKey={apiKey}
			options={{
				api_host: host,
				defaults: "2026-05-30",
				// Sentry handles error monitoring; avoid duplicate exception capture.
				capture_exceptions: false,
			}}
		>
			<PostHogIdentify />
			{children}
		</PostHogProvider>
	);
}
