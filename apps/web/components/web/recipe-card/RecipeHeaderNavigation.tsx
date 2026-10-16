"use client";

import {useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft} from "lucide-react";
import {Button} from "@/components/ui/button";

const RETURN_URL_KEY = "gotujto:recipe-return-url";
const RECIPE_RETURNING_KEY = "gotujto:recipe-returning";

export function RecipeHeaderNavigation() {
    const router = useRouter();
    const didAddHistoryTrapRef = useRef(false);

    useEffect(() => {
        if (!sessionStorage.getItem(RETURN_URL_KEY)) {
            return;
        }

        if (!didAddHistoryTrapRef.current) {
            window.history.pushState(window.history.state, "", window.location.href);
            didAddHistoryTrapRef.current = true;
        }

        const handleBrowserBack = () => {
            const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);

            if (returnUrl) {
                sessionStorage.setItem(RECIPE_RETURNING_KEY, "true");
                sessionStorage.removeItem(RETURN_URL_KEY);
                window.location.replace(returnUrl);
            }
        };

        window.addEventListener("popstate", handleBrowserBack);

        return () => {
            window.removeEventListener("popstate", handleBrowserBack);
        };
    }, []);

    function handleBack() {
        const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);

        if (returnUrl) {
            sessionStorage.setItem(RECIPE_RETURNING_KEY, "true");
            sessionStorage.removeItem(RETURN_URL_KEY);
            window.location.replace(returnUrl);
            return;
        }

        router.back();
    }

    return (
        <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
            <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Wróć"
                onClick={handleBack}
                className="rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            >
                <ArrowLeft className="size-5" />
            </Button>
        </nav>
    );
}
