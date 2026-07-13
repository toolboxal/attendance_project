import { useRouter } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { tv } from "tailwind-variants";
import { Button } from "#/components/ui/button";

/** Swap `background` to change the Pro Monthly card accent. */
const PRO_MONTHLY_ACCENT = {
	background: "oklch(0.95 0.052 163.051)",
} as const;

const pricingCard = tv({
	slots: {
		base: "flex flex-col gap-5 bg-zinc-900/50 border border-white/5 h-96 rounded-2xl p-6 md:p-6",
		cardTitle: "font-semibold text-2xl text-zinc-100",
		price: "font-medium text-2xl text-zinc-100",
		priceMuted: "text-base mx-0.5",
		featureList: "flex flex-col grow gap-3",
		featureItem: "font-light text-sm text-zinc-400",
		button: "mt-auto w-full",
		checkIcon: "shrink-0",
	},
	variants: {
		accented: {
			true: {
				base: "border-zinc-950/10",
				cardTitle: "text-zinc-950",
				price: "text-zinc-950",
				priceMuted: "text-zinc-700",
				featureItem: "text-zinc-950",
				button: "bg-zinc-950 text-zinc-50",
				checkIcon: "fill-zinc-700",
			},
			false: {
				checkIcon: "fill-zinc-500 stroke-zinc-950",
			},
		},
	},
	defaultVariants: {
		accented: false,
	},
});

type PricingTier = {
	name: string;
	features: string[];
	price: ReactNode;
	priceSuffix?: string;
	buttonLabel: string;
	variant: "default" | "outline";
	accented?: boolean;
	onSelect: () => void;
};

export function PricingSection() {
	const router = useRouter();
	const {
		base,
		cardTitle,
		price,
		priceMuted,
		featureList,
		featureItem,
		button,
		checkIcon,
	} = pricingCard();

	const handleCheckout = (slug: string) => {
		router.navigate({ to: "/signup", search: { checkoutSlug: slug } });
	};

	const tiers: PricingTier[] = [
		{
			name: "Free",
			features: [
				"1 draft · 1 live · 10 past events",
				"Basic attendee tracking",
				"Up to 5 staff seats",
			],
			price: "$0",
			buttonLabel: "Get Started",
			variant: "outline",
			onSelect: () =>
				router.navigate({
					to: "/signup",
					search: { checkoutSlug: undefined },
				}),
		},
		{
			name: "Single Pass",
			features: [
				"1 Pro Event Credit",
				"5 drafts · 1 live · 10 past events",
				"Up to 50 staff seats",
			],
			price: "$9",
			buttonLabel: "Buy 1 Credit",
			variant: "outline",
			onSelect: () => handleCheckout("single"),
		},
		{
			name: "Bundle",
			features: [
				"4 Pro Event Credits",
				"5 drafts · 1 live · 10 past events",
				"Save 17%",
			],
			price: "$30",
			buttonLabel: "Get 4 Credits",
			variant: "outline",
			onSelect: () => handleCheckout("bundle"),
		},
		{
			name: "Pro Monthly",
			features: [
				"8 Pro Event Credits / month",
				"5 drafts · 1 live · 10 past events",
				"Up to 50 staff seats",
			],
			price: "$49",
			priceSuffix: "/month",
			buttonLabel: "Subscribe",
			variant: "outline",
			accented: true,
			onSelect: () => handleCheckout("monthly"),
		},
	];

	return (
		<section id="pricing" className="spine py-24 md:py-32">
			<p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-4">
				Pricing
			</p>
			<h2 className="text-4xl md:text-5xl font-heading text-zinc-100 tracking-tight">
				Simple, transparent pricing
			</h2>
			<p className="text-lg text-zinc-400 mt-4 mb-12 max-w-2xl font-light leading-relaxed">
				For single events, or weekly activities. A plan for every need.
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
				{tiers.map((tier) => (
					<div
						key={tier.name}
						className={base({ accented: tier.accented })}
						style={
							tier.accented
								? { backgroundColor: PRO_MONTHLY_ACCENT.background }
								: undefined
						}
					>
						<h3 className={cardTitle({ accented: tier.accented })}>
							{tier.name}
						</h3>
						<div className={featureList()}>
							{tier.features.map((feature) => (
								<div key={feature} className="flex items-center gap-2">
									<CircleCheck
										size={16}
										className={checkIcon({ accented: tier.accented })}
										style={
											tier.accented
												? { stroke: PRO_MONTHLY_ACCENT.background }
												: undefined
										}
									/>
									<p className={featureItem({ accented: tier.accented })}>
										{feature}
									</p>
								</div>
							))}
						</div>
						<p className={price({ accented: tier.accented })}>
							{tier.price}
							{tier.priceSuffix ? (
								<span className={priceMuted({ accented: tier.accented })}>
									{tier.priceSuffix}
								</span>
							) : null}
						</p>
						<Button
							size="lg"
							className={button({ accented: tier.accented })}
							variant={tier.accented ? "ghost" : tier.variant}
							onClick={tier.onSelect}
						>
							{tier.buttonLabel}
						</Button>
					</div>
				))}
			</div>
		</section>
	);
}
