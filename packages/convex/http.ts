import {httpRouter} from "convex/server";

import {authComponent, createAuth} from "./auth";

const http = httpRouter();

// Expo Web is a client-side app on a different origin than the Convex site.
// Better Auth must therefore answer the browser's CORS preflight requests.
authComponent.registerRoutes(http, createAuth, {cors: true});

export default http;
