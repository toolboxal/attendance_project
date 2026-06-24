import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<button
			type="button"
			onClick={() => {
				console.log("Breaking the world");
				throw new Error("Sentry Test Error");
			}}
		>
			Break the world
		</button>
	);
}
