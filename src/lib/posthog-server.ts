import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

function getPostHogConfig() {
	const apiKey =
		process.env.POSTHOG_PROJECT_TOKEN ??
		process.env.VITE_POSTHOG_PROJECT_TOKEN;
	const host =
		process.env.POSTHOG_HOST ??
		process.env.VITE_POSTHOG_HOST ??
		"https://us.i.posthog.com";

	return { apiKey, host };
}

export function getPostHogClient() {
	const { apiKey, host } = getPostHogConfig();
	if (!apiKey) return null;

	if (!posthogClient) {
		posthogClient = new PostHog(apiKey, {
			host,
			flushAt: 1,
			flushInterval: 0,
		});
	}

	return posthogClient;
}
