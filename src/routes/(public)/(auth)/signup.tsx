import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "#/components/signup-form";

export const Route = createFileRoute("/(public)/(auth)/signup")({
	validateSearch: (search: Record<string, unknown>) => ({
		checkoutSlug: (search.checkoutSlug as string) ?? undefined,
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { checkoutSlug } = Route.useSearch();
	return (
		<div className=" min-h-dvh bg-zinc-950">
			<div className="spine flex items-center justify-center min-h-screen">
				<SignupForm checkoutSlug={checkoutSlug} />
			</div>
		</div>
	);
}
