import { createFileRoute, useRouter, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { CircleCheck } from "lucide-react";
import { tv } from "tailwind-variants";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/(public)/")({ component: Home });

const pricingCard = tv({
	slots: {
		base: "flex flex-col gap-6 bg-zinc-900 border border-zinc-950/15 h-96 rounded-2xl p-8 shadow-xl bg-radial-[at_100%_-50%] from-zinc-500/10 to-zinc-950 to-100% md:p-6",
		cardTitle: "font-heading text-2xl text-zinc-100",
		price: "font-medium text-3xl text-zinc-100",
		featureList: "flex flex-col grow gap-4",
		featureItem: "font-light text-base text-zinc-400",
		button: "mt-auto w-full",
	},
});

function Home() {
	const { base, cardTitle, price, featureList, featureItem, button } =
		pricingCard();
	const router = useRouter();
	const { isAuthenticated, isLoading } = useConvexAuth();

	// Redirect authenticated users straight to the dashboard
	if (!isLoading && isAuthenticated) {
		return (
			<Navigate
				to="/app/dashboard"
				search={{ checkoutSlug: undefined }}
				replace
			/>
		);
	}

	const handleCheckout = (slug: string) => {
		router.navigate({ to: "/signup", search: { checkoutSlug: slug } });
	};

	return (
		<div className="w-full bg-zinc-950">
			{/* Hero Section */}
			<section className="spine min-h-screen flex flex-col justify-center py-24 pb-12">
				<h1 className="text-5xl md:text-7xl font-heading text-white tracking-tight">
					Hero View
				</h1>
				<p className="text-lg text-amber-100 pt-4 max-w-xl">
					Public Page - Only for guest users. This section takes up the full
					height of the viewport.
				</p>
			</section>

			{/* Pricing Section */}
			<section className="spine min-h-screen py-32">
				<h2 className="text-4xl md:text-5xl font-heading text-zinc-100 tracking-tight">
					Pricing
				</h2>
				<p className="text-lg md:text-xl text-zinc-400 mt-6 mb-12 max-w-2xl font-light leading-relaxed">
					Simple, transparent pricing for every stage.
					<span className="block text-zinc-100 font-normal mt-1">
						Start for free, scale as you grow.
					</span>
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-24">
					{/* Free Tier */}
					<div className={base()}>
						<h3 className={cardTitle()}>Free</h3>
						<div className={featureList()}>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>1 Active Event Draft</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Basic attendee tracking</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Up to 5 staff seats</p>
							</div>
						</div>
						<p className={price()}>$0</p>
						<Button
							size={"xl"}
							className={button()}
							variant={"outline"}
							onClick={() =>
								router.navigate({
									to: "/signup",
									search: { checkoutSlug: undefined },
								})
							}
						>
							Get Started
						</Button>
					</div>

					{/* Single Pass */}
					<div className={base()}>
						<h3 className={cardTitle()}>Single Pass</h3>
						<div className={featureList()}>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>1 Pro Event Credit</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Indefinite expiration</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Full Pro Features</p>
							</div>
						</div>
						<p className={price()}>$9</p>
						<Button
							size={"xl"}
							className={button()}
							variant={"outline"}
							onClick={() => handleCheckout("single")}
						>
							Buy 1 Credit
						</Button>
					</div>

					{/* Weekend Bundle */}
					<div
						className={base({
							className:
								"border-emerald-300/20 bg-zinc-900/50 shadow-emerald-300/10",
						})}
					>
						<h3 className={cardTitle()}>Weekend Bundle</h3>
						<div className={featureList()}>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>3 Pro Event Credits</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Perfect for festivals</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Save 10%</p>
							</div>
						</div>
						<p className={price()}>$25</p>
						<Button
							size={"xl"}
							className={button()}
							onClick={() => handleCheckout("weekend")}
						>
							Get 3 Credits
						</Button>
					</div>

					{/* Pro Monthly */}
					<div className={base()}>
						<h3 className={cardTitle()}>Pro Monthly</h3>
						<div className={featureList()}>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Unlimited Pro Events</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Priority Support</p>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck
									size={18}
									className="fill-zinc-400 stroke-zinc-950"
								/>
								<p className={featureItem()}>Custom Discord Integration</p>
							</div>
						</div>
						<p className={price()}>
							$39<span className="text-base text-zinc-500 mx-0.5">/month</span>
						</p>
						<Button
							size={"xl"}
							className={button()}
							variant={"outline"}
							onClick={() => handleCheckout("monthly")}
						>
							Subscribe
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
