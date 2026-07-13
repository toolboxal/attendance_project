import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "#/components/public/login-form";
import { SITE_URL } from "#/lib/seo";

const SIGNIN_TITLE = "Sign in to Asistir";
const SIGNIN_DESCRIPTION =
	"Sign in to your Asistir account to manage events, staff, and live floor operations.";

export const Route = createFileRoute("/(public)/(auth)/signin")({
	head: () => ({
		meta: [
			{ title: SIGNIN_TITLE },
			{ name: "description", content: SIGNIN_DESCRIPTION },
			{ property: "og:title", content: SIGNIN_TITLE },
			{ property: "og:description", content: SIGNIN_DESCRIPTION },
			{ property: "og:url", content: `${SITE_URL}/signin` },
			{ name: "twitter:title", content: SIGNIN_TITLE },
			{ name: "twitter:description", content: SIGNIN_DESCRIPTION },
		],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-1 flex-col bg-zinc-950">
			<div className="spine flex flex-1 items-center justify-center">
				<LoginForm />
			</div>
		</div>
	);
}
