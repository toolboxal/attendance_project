import { usePostHog } from "@posthog/react";
import { useEffect } from "react";
import { authClient } from "#/lib/auth-client";

/** Links Better Auth session to PostHog for admin users. */
export function PostHogIdentify() {
	const posthog = usePostHog();
	const { data: session } = authClient.useSession();

	useEffect(() => {
		if (!posthog) return;

		const user = session?.user;
		if (user?.id) {
			posthog.identify(user.id, {
				email: user.email,
				name: user.name,
			});
			return;
		}

		posthog.reset();
	}, [posthog, session?.user]);

	return null;
}
