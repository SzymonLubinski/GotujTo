import {cookies} from "next/headers";
import {NextResponse} from "next/server";

const ADMIN_COOKIE = "gotujto_admin";

export async function GET() {
    const cookieStore = await cookies();

    const sessionCookie =
        cookieStore.get(ADMIN_COOKIE)?.value;

    const sessionSecret =
        process.env.ADMIN_SESSION_SECRET;

    const isAdmin =
        Boolean(sessionSecret) &&
        sessionCookie === sessionSecret;

    return NextResponse.json(
        {isAdmin},
        {
            headers: {
                "Cache-Control":
                    "private, no-store, max-age=0",
            },
        },
    );
}