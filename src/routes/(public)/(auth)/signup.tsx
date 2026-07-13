import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "#/components/public/signup-form";
import { SITE_URL } from "#/lib/seo";

const SIGNUP_TITLE = "Create your Asistir account";
const SIGNUP_DESCRIPTION =
	"Sign up for Asistir and start coordinating event staff on the live floor — free to get started.";

export const Route = createFileRoute("/(public)/(auth)/signup")({
	head: () => ({
		meta: [
			{ title: SIGNUP_TITLE },
			{ name: "description", content: SIGNUP_DESCRIPTION },
			{ property: "og:title", content: SIGNUP_TITLE },
			{ property: "og:description", content: SIGNUP_DESCRIPTION },
			{ property: "og:url", content: `${SITE_URL}/signup` },
			{ name: "twitter:title", content: SIGNUP_TITLE },
			{ name: "twitter:description", content: SIGNUP_DESCRIPTION },
		],
	}),
	validateSearch: (search: Record<string, unknown>) => ({
		checkoutSlug: search.checkoutSlug as string | undefined,
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { checkoutSlug } = Route.useSearch();
	return (
		<div className="flex flex-1 flex-col bg-zinc-950">
			<div className="spine flex flex-1 items-center justify-center">
				<SignupForm checkoutSlug={checkoutSlug} />
			</div>
		</div>
	);
}
