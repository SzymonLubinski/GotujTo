import {useEffect, useState, type ReactNode} from "react";
import {usePathname, useRouter} from "expo-router";
import {useConvexAuth, useQuery} from "convex/react";

import {api} from "@gotujto/convex/_generated/api";

type TermsAcceptanceGateProps = {
    children: ReactNode;
};

export function TermsAcceptanceGate({children}: TermsAcceptanceGateProps) {
    const pathname = usePathname();
    const router = useRouter();
    const {isAuthenticated, isLoading} = useConvexAuth();
    const [isSessionSettled, setIsSessionSettled] = useState(false);
    const hasAcceptedTerms = useQuery(
        api.legal.hasAcceptedTerms,
        isAuthenticated && isSessionSettled ? {} : "skip",
    );

    useEffect(() => {
        if (!isAuthenticated) {
            setIsSessionSettled(false);
            return;
        }

        // Po powrocie z OAuth Better Auth i Convex przez chwilę synchronizują
        // token. Nie odsyłamy wtedy użytkownika na ekran zgód na podstawie
        // przejściowego wyniku `false`.
        const timeout = setTimeout(() => setIsSessionSettled(true), 500);

        return () => clearTimeout(timeout);
    }, [isAuthenticated]);

    useEffect(() => {
        if (isLoading || !isSessionSettled || !isAuthenticated || hasAcceptedTerms !== false || pathname === "/accept-terms") {
            return;
        }

        router.replace("/accept-terms" as never);
    }, [hasAcceptedTerms, isAuthenticated, isLoading, isSessionSettled, pathname, router]);

    return children;
}
