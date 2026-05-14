import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { NotFoundComponent } from "./components/not-found";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
	if (!CONVEX_URL) {
		throw new Error("missing envar VITE_CONVEX_URL");
	}
	const convexQueryClient = new ConvexQueryClient(CONVEX_URL, {
		expectAuth: true,
	});

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
				// 🚀 Convex queries are fully reactive via WebSockets.
				// Disable redundant TanStack Query refetching to prevent double-querying on focus/reconnect.
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
			},
		},
	});
	convexQueryClient.connect(queryClient);

	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		context: { queryClient, convexQueryClient },
		scrollRestoration: true,
		defaultNotFoundComponent: NotFoundComponent,
		// Wrap: ({ children }) => (
		// 	<ConvexProvider client={convexQueryClient.convexClient}>
		// 		{children}
		// 	</ConvexProvider>
		// ),
	});
	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}
