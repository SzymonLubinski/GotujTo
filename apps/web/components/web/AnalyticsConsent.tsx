"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {GoogleAnalytics} from "@next/third-parties/google";

const ANALYTICS_CONSENT_KEY = "gotujto:analytics-consent";
const ANALYTICS_CONSENT_COOKIE = "gotujto_analytics_consent";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type AnalyticsConsent = "granted" | "denied" | null;

function readConsentCookie(): AnalyticsConsent {
    const cookie = document.cookie
        .split("; ")
        .find(entry => entry.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`));
    const value = cookie?.split("=")[1];

    return value === "granted" || value === "denied" ? value : null;
}

function writeConsentCookie(consent: Exclude<AnalyticsConsent, null>) {
    document.cookie = [
        `${ANALYTICS_CONSENT_COOKIE}=${consent}`,
        "Path=/",
        `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
        "SameSite=Lax",
        location.protocol === "https:" ? "Secure" : "",
    ].filter(Boolean).join("; ");
}

export function resetAnalyticsConsent() {
    window.localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    window.location.reload();
}

export function AnalyticsConsent() {
    const [consent, setConsent] = useState<AnalyticsConsent>(null);
    const [hasLoadedConsent, setHasLoadedConsent] = useState(false);

    useEffect(() => {
        const cookieConsent = readConsentCookie();

        if (cookieConsent) {
            setConsent(cookieConsent);
            setHasLoadedConsent(true);
            return;
        }

        const storedConsent = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);

        if (storedConsent === "granted" || storedConsent === "denied") {
            writeConsentCookie(storedConsent);
            setConsent(storedConsent);
        }

        setHasLoadedConsent(true);
    }, []);

    function saveConsent(nextConsent: Exclude<AnalyticsConsent, null>) {
        window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextConsent);
        writeConsentCookie(nextConsent);
        setConsent(nextConsent);
    }

    return (
        <>
            {consent === "granted" && <GoogleAnalytics gaId="G-8EK57W2DGW" />}

            {hasLoadedConsent && consent === null && (
                <section aria-label="Ustawienia cookies" className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-zinc-950/98 px-4 py-4 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-3xl">
                            <h2 className="text-base font-semibold">Twoja prywatność</h2>
                            <p className="mt-1.5 text-sm leading-6 text-zinc-300">
                                Używamy niezbędnych cookies, aby strona działała. Za Twoją zgodą wykorzystamy również Google Analytics do anonimowego pomiaru ruchu i ulepszania GotujTo. Szczegóły znajdziesz w <Link className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href="/polityka-prywatnosci">Polityce prywatności</Link>.
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:items-center">
                            <button className="min-h-11 rounded-lg px-4 text-sm font-medium text-white transition-colors hover:bg-white/10" onClick={() => saveConsent("denied")} type="button">
                                Tylko niezbędne
                            </button>
                            <button className="min-h-11 rounded-lg bg-lime-400 px-5 text-sm font-semibold text-black transition-colors hover:bg-lime-300" onClick={() => saveConsent("granted")} type="button">
                                Akceptuję analityczne
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
