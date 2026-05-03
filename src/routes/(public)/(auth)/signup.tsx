import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "#/components/signup-form";

export const Route = createFileRoute("/(public)/(auth)/signup")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className=" min-h-dvh bg-neutral-900">
			<div className="spine flex items-center justify-center min-h-screen">
				<SignupForm />
			</div>
		</div>
	);
}
