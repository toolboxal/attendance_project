import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { Suspense, useEffect } from "react";
import { DashboardEventAccordion } from "#/components/dashboard/DashboardEventAccordion";
import { DashboardIdleChrome } from "#/components/dashboard/DashboardIdleChrome";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { authClient } from "#/lib/auth-client";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { api } from "../../../../convex/_generated/api";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/dashboard")({
	validateSearch: (search: Record<string, unknown>) => ({
		checkoutSlug: search.checkoutSlug as string | undefined,
	}),
	component: DashboardRouteWrapper,
});

function DashboardRouteWrapper() {
	return (
		<Suspense
			fallback={
				<div className="w-full h-[calc(100vh-72px)] flex items-center justify-center bg-zinc-950">
					<Spinner className="size-8 text-zinc-700" />
				</div>
			}
		>
			<DashboardComponent />
		</Suspense>
	);
}

function DashboardComponent() {
	const { checkoutSlug } = Route.useSearch();
	const router = useRouter();
	const navigate = useNavigate();
	const setPageHeader = useHeaderStore((s) => s.setPageHeader);
	const resetHeader = useHeaderStore((s) => s.resetHeader);

	const { data: shell } = useSuspenseQuery(
		convexQuery(api.events.getDashboardShell, {}),
	);

	useEffect(() => {
		setPageHeader({
			title: "Dashboard",
			showBackButton: false,
			showLeftButton: false,
		});
		return () => resetHeader();
	}, [setPageHeader, resetHeader]);

	useEffect(() => {
		if (checkoutSlug) {
			const initiateCheckout = async () => {
				const { data } = await authClient.checkout({ slug: checkoutSlug });
				if (data?.url) {
					window.location.href = data.url;
				} else {
					router.navigate({
						to: "/app/dashboard",
						search: { checkoutSlug: undefined },
						replace: true,
					});
				}
			};
			initiateCheckout();
		}
	}, [checkoutSlug, router]);

	const events =
		shell.mode === "live"
			? [shell.event, ...shell.archivedEvents]
			: shell.archivedEvents;
	const defaultOpenEventId =
		shell.mode === "live" ? shell.event._id : undefined;

	const hasContent = events.length > 0 || shell.nextDraft != null;

	if (!hasContent) {
		return (
			<div className="w-full min-h-dvh bg-zinc-950">
				<div className="spine py-2 flex flex-col items-center justify-center gap-4 p-8 min-h-[50vh] text-left">
					<div className="flex flex-col gap-2">
						<p className="text-lg font-bold text-zinc-100">
							Thank you for using Asistir
						</p>
						<p className="text-sm italic text-zinc-400 max-w-md leading-relaxed">
							Asistir is a platform that helps you manage human traffic at your
							event. The core of this app is the "live floor", where your
							helpers can interact and direct attendees to the correct
							destination. Usual chat apps used as communication channels can
							create a lot of noise and confusion. Asistir is a simple and
							effective solution to this problem.
						</p>
						<p className="text-sm mt-1 text-zinc-100 max-w-md">
							Start by creating your first event.
						</p>

						<Button
							onClick={() => navigate({ to: "/app/events/create" })}
							variant="secondary"
							className="w-fit self-start mt-1"
						>
							Create Event
							<ArrowUpRight size={16} className="ml-1.5" />
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full min-h-dvh bg-zinc-950">
			<div className="spine flex flex-col gap-4 py-2 p-4 md:p-6">
				<DashboardIdleChrome
					nextDraft={shell.nextDraft}
					credits={shell.credits}
				/>

				{events.length > 0 ? (
					<DashboardEventAccordion
						events={events}
						defaultOpenEventId={defaultOpenEventId}
					/>
				) : (
					<div className="rounded-xl  bg-zinc-800/20 p-6 text-center">
						<p className="text-sm text-zinc-500">
							Live or archived events will appear here.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
