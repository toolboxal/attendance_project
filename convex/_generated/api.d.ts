/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as auth from "../auth.js";
import type * as constants from "../constants.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as liveAuth from "../liveAuth.js";
import type * as liveStaff from "../liveStaff.js";
import type * as payments from "../payments.js";
import type * as sectionDefaults from "../sectionDefaults.js";
import type * as sections from "../sections.js";
import type * as test from "../test.js";
import type * as watchlist from "../watchlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  auth: typeof auth;
  constants: typeof constants;
  events: typeof events;
  http: typeof http;
  jobs: typeof jobs;
  liveAuth: typeof liveAuth;
  liveStaff: typeof liveStaff;
  payments: typeof payments;
  sectionDefaults: typeof sectionDefaults;
  sections: typeof sections;
  test: typeof test;
  watchlist: typeof watchlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
