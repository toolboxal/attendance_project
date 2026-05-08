import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "#/components/ui/button";
import { useHeaderStore } from "#/lib/store/topHeaderStore";

export const Route = createFileRoute("/_authenticated/app/events/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);
	useEffect(() => {
		setPageHeader({
			title: "Create Event",
			showBackButton: true,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader]);

	return (
		<div className="w-full min-h-dvh bg-amber-800">
			<section className="spine min-h-screen flex flex-col justify-center py-24 pb-12 bg-zinc-950">
				<Button onClick={() => router.history.back()}>Back</Button>
			</section>
		</div>
	);
}
