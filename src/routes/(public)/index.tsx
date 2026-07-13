import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { AlertsPreview } from "#/components/public/landing/AlertsPreview";
import { Footer } from "#/components/public/landing/Footer";
import { HeroSection } from "#/components/public/landing/HeroSection";
import { JobsPreview } from "#/components/public/landing/JobsPreview";
import { MissionStatement } from "#/components/public/landing/MissionStatement";
import { PricingSection } from "#/components/public/landing/PricingSection";
import { RosterPreview } from "#/components/public/landing/RosterPreview";
import { WatchlistPreview } from "#/components/public/landing/WatchlistPreview";
import { clearSignedOutFlag, hasSignedOutFlag } from "#/lib/auth-session";
import {
	LANDING_DESCRIPTION,
	LANDING_TITLE,
	OG_IMAGE_META,
	SITE_URL,
} from "#/lib/seo";

export const Route = createFileRoute("/(public)/")({
	head: () => ({
		meta: [
			{ title: LANDING_TITLE },
			{ name: "description", content: LANDING_DESCRIPTION },
			{ property: "og:title", content: LANDING_TITLE },
			{ property: "og:description", content: LANDING_DESCRIPTION },
			{ property: "og:url", content: SITE_URL },
			{ property: "og:type", content: "website" },
			...OG_IMAGE_META,
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: LANDING_TITLE },
			{ name: "twitter:description", content: LANDING_DESCRIPTION },
		],
	}),
	component: Home,
});

function Home() {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const [skipAuthRedirect] = useState(hasSignedOutFlag);

	useEffect(() => {
		if (skipAuthRedirect) clearSignedOutFlag();
	}, [skipAuthRedirect]);

	if (!isLoading && isAuthenticated && !skipAuthRedirect) {
		return (
			<Navigate
				to="/app/dashboard"
				search={{ checkoutSlug: undefined }}
				replace
			/>
		);
	}

	return (
		<div className="w-full bg-zinc-950">
			<HeroSection />
			<MissionStatement />
			<JobsPreview />
			<AlertsPreview />
			<WatchlistPreview />
			<RosterPreview />
			<PricingSection />
			<Footer />
		</div>
	);
}
