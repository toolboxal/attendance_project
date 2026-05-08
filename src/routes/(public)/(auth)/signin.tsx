import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "#/components/public/login-form";

export const Route = createFileRoute("/(public)/(auth)/signin")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className=" min-h-dvh bg-zinc-950">
			<div className="spine flex items-center justify-center min-h-screen">
				<LoginForm />
			</div>
		</div>
	);
}
