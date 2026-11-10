"use client";

import {useEffect, useRef} from "react";
import {useConvexAuth, useMutation} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {TERMS_VERSION} from "@gotujto/shared/data/legal";

const PENDING_TERMS_ACCEPTANCE_KEY = "gotujto:pending-terms-acceptance";

export function markTermsAcceptancePending() {
    window.localStorage.setItem(PENDING_TERMS_ACCEPTANCE_KEY, TERMS_VERSION);
}

export function TermsAcceptanceRecorder() {
    const {isAuthenticated, isLoading} = useConvexAuth();
    const recordTermsAcceptance = useMutation(api.legal.recordTermsAcceptance);
    const isRecording = useRef(false);

    useEffect(() => {
        if (isLoading || !isAuthenticated || isRecording.current) {
            return;
        }

        if (window.localStorage.getItem(PENDING_TERMS_ACCEPTANCE_KEY) !== TERMS_VERSION) {
            return;
        }

        isRecording.current = true;
        void recordTermsAcceptance({})
            .then(() => {
                window.localStorage.removeItem(PENDING_TERMS_ACCEPTANCE_KEY);
            })
            .finally(() => {
                isRecording.current = false;
            });
    }, [isAuthenticated, isLoading, recordTermsAcceptance]);

    return null;
}
