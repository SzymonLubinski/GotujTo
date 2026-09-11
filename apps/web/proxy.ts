import {NextRequest, NextResponse} from "next/server";

export function proxy(request: NextRequest) {
    const authorization = request.headers.get("authorization");

    if (authorization) {
        const [scheme, credentials] = authorization.split(" ");

        if (scheme === "Basic" && credentials) {
            const [username, password] = atob(credentials).split(":");

            if (
                username === process.env.ADMIN_USERNAME &&
                password === process.env.ADMIN_PASSWORD
            ) {
                return NextResponse.next();
            }
        }
    }

    return new NextResponse("Wymagane uwierzytelnienie.", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="GotujTo Admin"',
        },
    });
}

export const config = {
    matcher: ["/admin/:path*"],
};