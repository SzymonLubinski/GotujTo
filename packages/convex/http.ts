import {httpRouter} from "convex/server";
import {httpAction} from "./_generated/server";

import {authComponent, createAuth} from "./auth";
import {internal} from "./_generated/api";

const http = httpRouter();

// Expo Web is a client-side app on a different origin than the Convex site.
// Better Auth must therefore answer the browser's CORS preflight requests.
authComponent.registerRoutes(http, createAuth, {cors: true});

http.route({
    path: "/newsletter/unsubscribe",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const token = new URL(request.url).searchParams.get("token")?.trim();
        const unsubscribed = token
            ? await ctx.runMutation(internal.notifications.unsubscribeWithToken, {token})
            : false;
        const message = unsubscribed
            ? "Nie będziesz już otrzymywać newslettera GotujTo."
            : "Ten link jest nieprawidłowy albo newsletter został już wyłączony.";

        return new Response(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GotujTo</title></head><body style="font-family:Arial,sans-serif;background:#09090b;color:#fafafa;display:grid;place-items:center;min-height:100vh;margin:0"><main style="max-width:440px;padding:32px;text-align:center"><h1 style="color:#a3e635">GotujTo</h1><p>${message}</p><a href="https://gotujto.com" style="color:#bef264">Wróć do GotujTo</a></main></body></html>`, {
            headers: {"Content-Type": "text/html; charset=utf-8"},
        });
    }),
});

export default http;
