import {NextRequest, NextResponse} from "next/server";

const ADMIN_COOKIE = "gotujto_admin";

export function proxy(request: NextRequest) {
    const authorization =
        request.headers.get("authorization");

    if (authorization) {
        const [scheme, credentials] =
            authorization.split(" ");

        if (scheme === "Basic" && credentials) {
            try {
                const decoded = atob(credentials);
                const separatorIndex =
                    decoded.indexOf(":");

                const username =
                    decoded.slice(0, separatorIndex);

                const password =
                    decoded.slice(separatorIndex + 1);

                if (
                    username ===
                    process.env.ADMIN_USERNAME &&
                    password ===
                    process.env.ADMIN_PASSWORD
                ) {
                    const sessionSecret =
                        process.env.ADMIN_SESSION_SECRET;

                    if (!sessionSecret) {
                        return new NextResponse(
                            "Brakuje konfiguracji sesji administratora.",
                            {status: 500},
                        );
                    }

                    const response =
                        NextResponse.next();

                    response.cookies.set({
                        name: ADMIN_COOKIE,
                        value: sessionSecret,
                        httpOnly: true,
                        secure:
                            process.env.NODE_ENV ===
                            "production",
                        sameSite: "strict",
                        path: "/",
                        maxAge: 60 * 60 * 8,
                    });

                    return response;
                }
            } catch {
                // Nieprawidłowy nagłówek Basic Auth.
            }
        }
    }

    return new NextResponse(
        "Wymagane uwierzytelnienie.",
        {
            status: 401,
            headers: {
                "WWW-Authenticate":
                    'Basic realm="GotujTo Admin"',
            },
        },
    );
}

export const config = {
    matcher: ["/admin/:path*"],
};