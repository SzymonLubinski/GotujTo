import {redirect} from "next/navigation";

import {isAuthenticated} from "@/lib/auth-server";
import {TermsAcceptanceForm} from "@/components/web/TermsAcceptanceForm";

export const metadata = {
    robots: {index: false, follow: false},
    title: "Akceptacja Regulaminu",
};

type AcceptTermsPageProps = {
    searchParams: Promise<{next?: string | string[]}>;
};

function getNextPath(value: string | string[] | undefined) {
    const path = typeof value === "string" ? value : "/profile";

    return path.startsWith("/") && !path.startsWith("//") ? path : "/profile";
}

export default async function AcceptTermsPage({searchParams}: AcceptTermsPageProps) {
    if (!(await isAuthenticated())) {
        redirect("/login");
    }

    const {next} = await searchParams;

    return (
        <main className="flex min-h-dvh items-center justify-center bg-black px-5 py-12 text-white">
            <TermsAcceptanceForm nextPath={getNextPath(next)} />
        </main>
    );
}
