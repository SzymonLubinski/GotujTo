"use client";

import {type FormEvent, useState} from "react";
import {useRouter} from "next/navigation";
import {useMutation} from "convex/react";
import {AlertTriangle, LoaderCircle, Trash2} from "lucide-react";

import {api} from "@gotujto/convex/_generated/api";
import {authClient} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

function getErrorMessage(error: unknown) {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "SESSION_EXPIRED"
    ) {
        return "Dla bezpieczenstwa zaloguj sie ponownie i sprobuj jeszcze raz.";
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        const {message} = error as {message?: unknown};

        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    }

    return "Nie udalo sie usunac konta. Sprobuj ponownie.";
}

export function AccountDeletionForm({hasCredentialAccount}: {hasCredentialAccount: boolean}) {
    const router = useRouter();
    const prepareAccountDeletion = useMutation(api.userDashboard.prepareAccountDeletion);
    const [deleteApprovedRecipes, setDeleteApprovedRecipes] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (confirmation.trim().toUpperCase() !== "USUN") {
            setError('Wpisz "USUN", aby potwierdzic usuniecie konta.');
            return;
        }

        const password = String(new FormData(event.currentTarget).get("deleteAccountPassword") ?? "");

        if (hasCredentialAccount && !password) {
            setError("Podaj obecne haslo, aby usunac konto.");
            return;
        }

        setIsPending(true);

        try {
            await prepareAccountDeletion({deleteApprovedRecipes});
            const result = await authClient.deleteUser({
                callbackURL: "/",
                ...(hasCredentialAccount ? {password} : {}),
            });

            if (result.error) {
                setError(getErrorMessage(result.error));
                return;
            }

            router.replace("/");
            router.refresh();
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Card className="border border-red-400/30 bg-red-950/15 text-white">
            <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-full bg-red-400/15 text-red-300"><AlertTriangle className="size-5" /></div>
                <CardTitle>Usun konto</CardTitle>
                <CardDescription className="text-zinc-300">Tej operacji nie da sie cofnac. Lodowka, ulubione oraz niezaakceptowane zgloszenia zostana usuniete.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                        <Checkbox
                            id="deleteApprovedRecipes"
                            checked={deleteApprovedRecipes}
                            className="mt-0.5 border-red-300/60 data-checked:border-red-400 data-checked:bg-red-400 data-checked:text-black"
                            onCheckedChange={checked => setDeleteApprovedRecipes(checked === true)}
                        />
                        <Label htmlFor="deleteApprovedRecipes" className="cursor-pointer text-sm font-normal leading-5 text-zinc-200">
                            Usun rowniez moje zaakceptowane przepisy. Bez zaznaczenia zostana zachowane i przypisane autorowi GotujTo.
                        </Label>
                    </div>

                    {hasCredentialAccount && (
                        <div className="space-y-2">
                            <Label htmlFor="deleteAccountPassword">Obecne haslo</Label>
                            <Input id="deleteAccountPassword" name="deleteAccountPassword" type="password" autoComplete="current-password" className="border-white/15 bg-black/30 text-white" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="deleteAccountConfirmation">Wpisz USUN, aby potwierdzic</Label>
                        <Input id="deleteAccountConfirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" className="border-white/15 bg-black/30 text-white" />
                    </div>

                    {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>}

                    <Button type="submit" disabled={isPending} variant="destructive" className="w-full">
                        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        Usun konto na zawsze
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
