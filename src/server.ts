import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import type { Register } from "@tanstack/react-router";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import type { RequestHandler } from "@tanstack/react-start/server";

const handler = createStartHandler(defaultStreamHandler);

export type ServerEntry = { fetch: RequestHandler<Register> };

export function createServerEntry(entry: ServerEntry): ServerEntry {
	return {
		async fetch(...args) {
			return await entry.fetch(...args);
		},
	};
}

export default createServerEntry(
	wrapFetchWithSentry({
		fetch(request: Request, opts?: unknown) {
			return handler(
				request,
				opts as Parameters<typeof handler>[1],
			);
		},
	}),
);
