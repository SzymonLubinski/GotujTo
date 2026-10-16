"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {FormEvent, useEffect, useState} from "react";
import {LoaderCircle} from "lucide-react";

import {authClient} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

type AuthMode = "login" | "register";

type AuthFormProps = {
    mode: AuthMode;
};

function getErrorMessage(error: unknown) {
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 429
    ) {
        return "Zbyt wiele prob. Sprobuj ponownie pozniej.";
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        const {message} = error as {message?: unknown};

        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    }

    return "Nie udało się wykonać tej operacji. Spróbuj ponownie.";
}

function hasErrorCode(error: unknown, code: string) {
    return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

export function AuthForm({mode}: AuthFormProps) {
    const router = useRouter();
    const {data: session, isPending: isSessionPending} = authClient.useSession();
    const isRegistering = mode === "register";
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!isSessionPending && session) {
            router.replace("/profile");
        }
    }, [isSessionPending, router, session]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setNotice(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const name = String(formData.get("name") ?? "").trim();

        setIsPending(true);

        try {
            if (isRegistering) {
                const result = await authClient.signUp.email({
                    email,
                    name,
                    password,
                    callbackURL: "/profile",
                });

                if (result.error) {
                    setError(getErrorMessage(result.error));
                    return;
                }

                setNotice("Wysłaliśmy link aktywacyjny. Potwierdź adres e-mail, aby zalogować się do GotujTo.");
                form.reset();
                return;
            }

            const result = await authClient.signIn.email({
                email,
                password,
                rememberMe: true,
                callbackURL: "/profile",
            });

            if (result.error) {
                if (hasErrorCode(result.error, "EMAIL_NOT_VERIFIED")) {
                    router.replace("/verify-email?email=" + encodeURIComponent(email));
                    return;
                }

                setError(getErrorMessage(result.error));
                return;
            }

            router.replace("/profile");
            router.refresh();
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    async function handleGoogleSignIn() {
        setError(null);
        setNotice(null);
        setIsPending(true);

        try {
            const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: "/profile",
            });

            if (result.error) {
                setError(getErrorMessage(result.error));
            }
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    const title = isRegistering ? "Załóż konto" : "Zaloguj się";
    const submitLabel = isRegistering ? "Utwórz konto" : "Zaloguj się";

    if (isSessionPending || session) {
        return (
            <section aria-live="polite" className="flex w-full max-w-md items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/90 p-12 text-zinc-300 shadow-2xl shadow-black/30 backdrop-blur">
                <LoaderCircle aria-label="Sprawdzanie sesji" className="size-6 animate-spin text-lime-300" />
            </section>
        );
    }

    return (
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
                {isRegistering
                    ? "Zapisuj ulubione przepisy i korzystaj z GotujTo na swoich urządzeniach."
                    : "Wróć do swoich przepisów i ustawień GotujTo."}
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                {isRegistering && (
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-200">Imię lub nazwa</Label>
                        <Input
                            autoComplete="name"
                            className="h-11 border-white/15 bg-black/30 text-white placeholder:text-zinc-500"
                            id="name"
                            name="name"
                            required
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-200">Adres e-mail</Label>
                    <Input
                        autoComplete="email"
                        className="h-11 border-white/15 bg-black/30 text-white placeholder:text-zinc-500"
                        id="email"
                        name="email"
                        required
                        type="email"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-200">Hasło</Label>
                    <Input
                        autoComplete={isRegistering ? "new-password" : "current-password"}
                        className="h-11 border-white/15 bg-black/30 text-white placeholder:text-zinc-500"
                        id="password"
                        minLength={8}
                        name="password"
                        required
                        type="password"
                    />
                    {isRegistering && <p className="text-xs text-zinc-500">Co najmniej 8 znaków.</p>}
                </div>

                {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}
                {notice && <p role="status" className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-100">{notice}</p>}

                <Button className="h-11 w-full rounded-full bg-lime-400 font-semibold text-black hover:bg-lime-300" disabled={isPending} type="submit">
                    {isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </form>

            {!isRegistering && (
                <p className="mt-4 text-right text-sm">
                    <Link className="font-medium text-lime-300 hover:text-lime-200" href="/forgot-password">
                        Nie pamiętasz hasła?
                    </Link>
                </p>
            )}

            <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
                <span className="h-px flex-1 bg-white/10" />
                lub
                <span className="h-px flex-1 bg-white/10" />
            </div>

            <Button className="h-11 w-full rounded-full border-white/20 bg-white text-black hover:bg-zinc-200" disabled={isPending} onClick={handleGoogleSignIn} type="button" variant="outline">
                Kontynuuj przez Google
            </Button>

            <p className="mt-6 text-center text-sm text-zinc-400">
                {isRegistering ? "Masz już konto?" : "Nie masz jeszcze konta?"}{" "}
                <Link className="font-semibold text-lime-300 hover:text-lime-200" href={isRegistering ? "/login" : "/register"}>
                    {isRegistering ? "Zaloguj się" : "Załóż konto"}
                </Link>
            </p>
        </section>
    );
}
