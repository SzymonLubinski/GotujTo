"use client";

import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {type FormEvent, useState} from "react";
import {LoaderCircle} from "lucide-react";

import {authClient} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

function getErrorMessage(error: unknown) {
    if (typeof error === "object" && error !== null && "message" in error) {
        const {message} = error as {message?: unknown};

        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    }

    return "Nie udało się ustawić nowego hasła. Poproś o nowy link.";
}

export function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const tokenError = searchParams.get("error");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(
        tokenError || !token ? "Link do resetu hasła jest nieprawidłowy albo wygasł." : null,
    );
    const [notice, setNotice] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!token) {
            setError("Link do resetu hasła jest nieprawidłowy albo wygasł.");
            return;
        }

        const form = event.currentTarget;
        const formData = new FormData(form);
        const newPassword = String(formData.get("newPassword") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        setError(null);
        setNotice(null);

        if (newPassword !== confirmPassword) {
            setError("Wpisane hasła nie są takie same.");
            return;
        }

        setIsPending(true);

        try {
            const result = await authClient.resetPassword({
                newPassword,
                token,
            });

            if (result.error) {
                setError(getErrorMessage(result.error));
                return;
            }

            form.reset();
            setNotice("Hasło zostało zmienione. Możesz się teraz zalogować.");
            window.setTimeout(() => router.replace("/login"), 1_500);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <h1 className="text-3xl font-bold text-white">Ustaw nowe hasło</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Nowe hasło musi mieć co najmniej 8 znaków.</p>

            {token && !tokenError && !notice && (
                <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label className="text-zinc-200" htmlFor="newPassword">Nowe hasło</Label>
                        <Input
                            autoComplete="new-password"
                            className="h-11 border-white/15 bg-black/30 text-white placeholder:text-zinc-500"
                            id="newPassword"
                            minLength={8}
                            name="newPassword"
                            required
                            type="password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-200" htmlFor="confirmPassword">Powtórz nowe hasło</Label>
                        <Input
                            autoComplete="new-password"
                            className="h-11 border-white/15 bg-black/30 text-white placeholder:text-zinc-500"
                            id="confirmPassword"
                            minLength={8}
                            name="confirmPassword"
                            required
                            type="password"
                        />
                    </div>

                    {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}

                    <Button className="h-11 w-full rounded-full bg-lime-400 font-semibold text-black hover:bg-lime-300" disabled={isPending} type="submit">
                        {isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                        Zmień hasło
                    </Button>
                </form>
            )}

            {notice && <p className="mt-7 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-100" role="status">{notice}</p>}
            {(!token || tokenError) && error && <p className="mt-7 rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}

            <p className="mt-6 text-center text-sm text-zinc-400">
                <Link className="font-semibold text-lime-300 hover:text-lime-200" href="/forgot-password">
                    Wyślij nowy link
                </Link>
            </p>
        </section>
    );
}
