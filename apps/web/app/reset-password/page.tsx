import {Suspense} from "react";

import {ResetPasswordForm} from "@/components/web/ResetPasswordForm";

export const metadata = {
    title: "Ustaw nowe hasło",
};

export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-dvh items-center justify-center bg-black px-5 py-12 text-white">
            <Suspense fallback={<div aria-label="Ładowanie" className="size-6 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" />}>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
