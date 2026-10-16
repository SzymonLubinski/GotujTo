/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as blog from "../blog.js";
import type * as contactRateLimits from "../contactRateLimits.js";
import type * as convex__generated_api from "../convex/_generated/api.js";
import type * as convex__generated_server from "../convex/_generated/server.js";
import type * as deals from "../deals.js";
import type * as http from "../http.js";
import type * as lib_requireAdmin from "../lib/requireAdmin.js";
import type * as products from "../products.js";
import type * as recipeImports from "../recipeImports.js";
import type * as recipes from "../recipes.js";
import type * as social from "../social.js";
import type * as userDashboard from "../userDashboard.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  blog: typeof blog;
  contactRateLimits: typeof contactRateLimits;
  "convex/_generated/api": typeof convex__generated_api;
  "convex/_generated/server": typeof convex__generated_server;
  deals: typeof deals;
  http: typeof http;
  "lib/requireAdmin": typeof lib_requireAdmin;
  products: typeof products;
  recipeImports: typeof recipeImports;
  recipes: typeof recipes;
  social: typeof social;
  userDashboard: typeof userDashboard;
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
