import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(public)/")({ component: Home });

function Home() {
	return (
		<div className="spine pt-24">
			<p className="text-base text-amber-100 pt-4">
				Public Page - Only for guest users
			</p>
		</div>
	);
}
