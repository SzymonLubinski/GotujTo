import {Suspense} from "react";

import {VerificationEmailForm} from "@/components/web/VerificationEmailForm";

export const metadata = {
    title: "Aktywuj konto",
};

export default function VerifyEmailPage() {
    return (
        <main className="flex min-h-dvh items-center justify-center bg-black px-5 py-12 text-white">
            <Suspense fallback={<div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-lime-300" />}>
                <VerificationEmailForm />
            </Suspense>
        </main>
    );
}
