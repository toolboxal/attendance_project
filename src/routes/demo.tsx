import { createFileRoute } from "@tanstack/react-router";
import { DemoFloorApp } from "#/demo/DemoFloorApp";
import { SITE_URL } from "#/lib/seo";

const DEMO_TITLE = "Try Asistir — Interactive live floor demo";
const DEMO_DESCRIPTION =
	"Explore Asistir’s live floor tools — jobs, alerts, and roster — in an interactive demo. No account required.";

export const Route = createFileRoute("/demo")({
	head: () => ({
		meta: [
			{ title: DEMO_TITLE },
			{ name: "description", content: DEMO_DESCRIPTION },
			{ property: "og:title", content: DEMO_TITLE },
			{ property: "og:description", content: DEMO_DESCRIPTION },
			{ property: "og:url", content: `${SITE_URL}/demo` },
			{ name: "twitter:title", content: DEMO_TITLE },
			{ name: "twitter:description", content: DEMO_DESCRIPTION },
		],
	}),
	component: DemoFloorApp,
});
