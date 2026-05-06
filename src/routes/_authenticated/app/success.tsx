import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/success")({
	validateSearch: (search: Record<string, unknown>) => ({
		checkout_id: (search.checkout_id as string) ?? undefined,
	}),
	component: SuccessPage,
});

function SuccessPage() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white min-h-[calc(100vh-4rem)]">
			<div className="flex flex-col items-center gap-6 text-center max-w-md px-8 py-12 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
				<div className="rounded-full bg-emerald-500/10 p-6 animate-in zoom-in duration-500">
					<CheckCircle size={48} className="text-emerald-400" />
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-heading text-zinc-100 tracking-tight">
						Payment Successful!
					</h1>
					<p className="text-zinc-400 font-light">
						Your credits have been securely added to your account. You're ready
						to create your first Pro event.
					</p>
				</div>
				<Link to="/app/dashboard" search={{ checkoutSlug: undefined }}>
					<Button size="lg" className="mt-4">
						Return to Dashboard
					</Button>
				</Link>
			</div>
		</div>
	);
}
