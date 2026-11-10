"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useMutation, useQuery} from "convex/react";
import {LoaderCircle} from "lucide-react";

import {api} from "@gotujto/convex/_generated/api";
import {Button} from "@/components/ui/button";

type TermsAcceptanceFormProps = {
    nextPath: string;
};

export function TermsAcceptanceForm({nextPath}: TermsAcceptanceFormProps) {
    const hasAcceptedTerms = useQuery(api.legal.hasAcceptedTerms, {});
    const recordTermsAcceptance = useMutation(api.legal.recordTermsAcceptance);
    const [isChecked, setIsChecked] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (hasAcceptedTerms) {
            window.location.replace(nextPath);
        }
    }, [hasAcceptedTerms, nextPath]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!isChecked) {
            setError("Aby utworzyc konto, zaakceptuj Regulamin i Polityke prywatnosci.");
            return;
        }

        setIsPending(true);

        try {
            await recordTermsAcceptance({accepted: true});
            window.location.replace(nextPath);
        } catch {
            setError("Nie udalo sie zapisac akceptacji. Sprobuj ponownie.");
        } finally {
            setIsPending(false);
        }
    }

    if (hasAcceptedTerms === undefined) {
        return <LoaderCircle aria-label="Sprawdzanie akceptacji Regulaminu" className="size-6 animate-spin text-lime-300" />;
    }

    return (
        <form className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8" onSubmit={handleSubmit}>
            <p className="text-sm font-semibold uppercase tracking-wider text-lime-300">Ostatni krok</p>
            <h1 className="mt-3 text-3xl font-bold text-white">Zaakceptuj warunki korzystania</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Aby dokończyć zakładanie konta i korzystać z funkcji GotujTo, potwierdź akceptację poniższych dokumentów.</p>

            <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm leading-5 text-zinc-300">
                <input checked={isChecked} className="mt-1 size-4 shrink-0 accent-lime-400" onChange={event => { setIsChecked(event.target.checked); setError(null); }} type="checkbox" />
                <span>Akceptuję <Link className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href="/regulamin" target="_blank">Regulamin</Link> oraz <Link className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href="/polityka-prywatnosci" target="_blank">Politykę prywatności</Link>.</span>
            </label>

            {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}

            <Button className="mt-6 h-11 w-full rounded-full bg-lime-400 font-semibold text-black hover:bg-lime-300" disabled={isPending} type="submit">
                {isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                Kontynuuj
            </Button>
        </form>
    );
}
