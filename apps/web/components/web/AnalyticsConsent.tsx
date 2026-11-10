"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {GoogleAnalytics} from "@next/third-parties/google";

const ANALYTICS_CONSENT_KEY = "gotujto:analytics-consent";
type AnalyticsConsent = "granted" | "denied" | null;

export function resetAnalyticsConsent() {
    window.localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    window.location.reload();
}

export function AnalyticsConsent() {
    const [consent, setConsent] = useState<AnalyticsConsent>(null);

    useEffect(() => {
        const storedConsent = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);

        if (storedConsent === "granted" || storedConsent === "denied") {
            setConsent(storedConsent);
        }
    }, []);

    function saveConsent(nextConsent: Exclude<AnalyticsConsent, null>) {
        window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextConsent);
        setConsent(nextConsent);
    }

    return (
        <>
            {consent === "granted" && <GoogleAnalytics gaId="G-8EK57W2DGW" />}

            {consent === null && (
                <section aria-label="Ustawienia cookies" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-5 text-sm text-white shadow-2xl">
                    <p className="font-semibold">Cookies analityczne</p>
                    <p className="mt-2 leading-6 text-zinc-300">
                        Za Twoją zgodą używamy Google Analytics do pomiaru ruchu i ulepszania GotujTo. Niezbędne mechanizmy sesyjne działają niezależnie.
                    </p>
                    <p className="mt-2 text-zinc-400">
                        Szczegóły opisuje <Link className="text-lime-300 underline underline-offset-4" href="/polityka-prywatnosci">Polityka prywatności</Link>.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                        <button className="rounded-full border border-white/20 px-4 py-2 font-medium hover:bg-white/10" onClick={() => saveConsent("denied")} type="button">
                            Odrzuć
                        </button>
                        <button className="rounded-full bg-lime-400 px-4 py-2 font-semibold text-black hover:bg-lime-300" onClick={() => saveConsent("granted")} type="button">
                            Akceptuję
                        </button>
                    </div>
                </section>
            )}
        </>
    );
}
