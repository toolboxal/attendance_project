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
import { clearSignedOutFlag, hasSignedOutFlag } from "#/lib/auth-session";

export const Route = createFileRoute("/(public)/")({ component: Home });

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
			<RosterPreview />
			<PricingSection />
			<Footer />
		</div>
	);
}
