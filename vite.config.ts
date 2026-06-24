import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const config = defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const sentryDsn = env.VITE_SENTRY_DSN ?? env.SENTRY_DSN ?? "";

	return {
		resolve: { tsconfigPaths: true },
		define: {
			"import.meta.env.VITE_SENTRY_DSN": JSON.stringify(sentryDsn),
		},
		ssr: {
			noExternal: [
				"@convex-dev/better-auth",
				"@posthog/react",
				"posthog-js",
			],
		},
		// optimizeDeps: {
		// 	holdUntilCrawlEnd: true,
		// },
		plugins: [
			devtools(),
			tailwindcss(),
			tanstackStart(),
			viteReact(),
			babel({ presets: [reactCompilerPreset()] }),
			// sentryTanstackStart must be the last plugin
			sentryTanstackStart({
				org: "alvin-dev-apps-pte-ltd",
				project: "attendance_project",
				authToken: env.SENTRY_AUTH_TOKEN,
			}),
		],
	};
});

export default config;
