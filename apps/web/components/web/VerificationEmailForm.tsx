"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {type FormEvent, useState} from "react";
import {LoaderCircle, MailCheck} from "lucide-react";

import {authClient} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

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

    return "Nie udalo sie wyslac linku aktywacyjnego. Sprobuj ponownie.";
}

export function VerificationEmailForm() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setNotice(null);

        setIsPending(true);

        try {
            const result = await authClient.sendVerificationEmail({
                email: email.trim(),
                callbackURL: "/profile",
            });

            if (result.error) {
                setError(getErrorMessage(result.error));
                return;
            }

            setNotice("Jesli istnieje nieaktywne konto z tym adresem, wyslalismy nowy link aktywacyjny.");
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-full bg-lime-400/15 text-lime-300">
                <MailCheck className="size-5" />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-white">Konto nie jest aktywowane</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
                Potwierdz adres e-mail przez link aktywacyjny. Nie masz wiadomosci lub link wygasl? Mozesz poprosic o nowy.
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label className="text-zinc-200" htmlFor="email">Adres e-mail</Label>
                    <Input
                        autoComplete="email"
                        className="h-11 border-white/15 bg-black/30 text-white placeholder:text-zinc-500"
                        id="email"
                        name="email"
                        onChange={event => setEmail(event.target.value)}
                        required
                        type="email"
                        value={email}
                    />
                </div>

                {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}
                {notice && <p className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-100" role="status">{notice}</p>}

                <Button className="h-11 w-full rounded-full bg-lime-400 font-semibold text-black hover:bg-lime-300" disabled={isPending} type="submit">
                    {isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    Wyslij nowy link aktywacyjny
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-400">
                <Link className="font-semibold text-lime-300 hover:text-lime-200" href="/login">
                    Wroc do logowania
                </Link>
            </p>
        </section>
    );
}
