"use client";

import {resetAnalyticsConsent} from "@/components/web/AnalyticsConsent";

export function AnalyticsConsentSettingsButton() {
    return (
        <button
            className="text-sm text-lime-300 underline underline-offset-4 hover:text-lime-200"
            onClick={resetAnalyticsConsent}
            type="button"
        >
            Zmień ustawienia cookies analitycznych
        </button>
    );
}
