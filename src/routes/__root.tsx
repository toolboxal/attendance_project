/// <reference types="vite/client" />

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import * as Sentry from "@sentry/tanstackstart-react";
import type * as React from "react";
import { useEffect } from "react";
import { NotFoundComponent } from "#/components/not-found";
import { GlobalErrorComponent } from "#/components/error-component";
import { AppPostHogProvider } from "#/components/posthog-provider";
import { authClient } from "#/lib/auth-client";
import { getToken } from "#/lib/auth-server";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

// Get auth information for SSR using available cookies
const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	return await getToken();
});
export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon-white.svg", type: "image/svg+xml" },
		],
	}),
	beforeLoad: async (ctx) => {
		// Only fetch the token during SSR — on the server, `serverHttpClient` exists.
		// Client-side navigations skip this round trip entirely; auth state is
		// managed reactively by ConvexBetterAuthProvider after the initial hydration.
		const isSSR = !!ctx.context.convexQueryClient.serverHttpClient;
		const token = isSSR ? await getAuth() : null;

		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}
		return {
			isAuthenticated: !!token,
			token,
		};
	},
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ({ error, reset, info }) => {
		useEffect(() => {
			Sentry.captureException(error);
		}, [error]);
		return <GlobalErrorComponent error={error} reset={reset} info={info} />;
	},
});
function RootComponent() {
	const context = useRouteContext({ from: Route.id });
	return (
		<ConvexBetterAuthProvider
			client={context.convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={context.token}
		>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</ConvexBetterAuthProvider>
	);
}
function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="bg-neutral-950 text-neutral-50">
				<AppPostHogProvider>
					{children}
					<Toaster />
				</AppPostHogProvider>
				{/* <TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/> */}
				<Scripts />
			</body>
		</html>
	);
}
