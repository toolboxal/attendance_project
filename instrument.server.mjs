import * as Sentry from "@sentry/tanstackstart-react";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV ?? "development",
	});
}
