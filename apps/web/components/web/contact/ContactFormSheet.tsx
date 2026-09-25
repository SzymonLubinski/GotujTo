"use client";

import {
    type FormEvent,
    type ReactNode,
    useRef,
    useState,
    useTransition,
} from "react";
import {toast} from "sonner";
import {sendContactMessageAction} from "@/app/actions";
import type {ContactSubmission} from "@/lib/schemas/contact";
import {Button} from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

type RecipeContext = {
    recipeId: string;
    recipeName: string;
};

type ContactFormSheetProps = {
    children: ReactNode;
    recipe?: RecipeContext;
};

const recipeCategories = [
    {value: "recipe-ingredients", label: "Składniki"},
    {value: "recipe-steps", label: "Kroki przygotowania"},
    {value: "recipe-photo", label: "Zdjęcie lub film"},
    {value: "recipe-other", label: "Inny problem"},
] as const;

export function ContactFormSheet({
    children,
    recipe,
}: ContactFormSheetProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState<ContactSubmission["category"]>(
        recipe ? recipeCategories[0].value : "contact",
    );
    const [isPending, startTransition] = useTransition();
    const formStartedAtRef = useRef<number | null>(null);
    const honeypotRef = useRef<HTMLInputElement>(null);

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            formStartedAtRef.current = Date.now();
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        startTransition(async () => {
            const result = await sendContactMessageAction({
                category,
                email,
                message,
                recipe: recipe
                    ? {
                        id: recipe.recipeId,
                        name: recipe.recipeName,
                        url: window.location.href,
                    }
                    : undefined,
                honeypot: honeypotRef.current?.value ?? "",
                formStartedAt: formStartedAtRef.current ?? Date.now(),
            });

            if (!result.success) {
                toast.error(result.error);
                return;
            }

            setMessage("");
            setEmail("");
            setOpen(false);
            toast.success("Wiadomość została wysłana. Dziękujemy!");
        });
    }

    const title = recipe
        ? "Zgłoś błąd w przepisie"
        : "Napisz do nas";
    const description = recipe
        ? `Zgłoszenie dotyczy: ${recipe.recipeName}`
        : "Opisz pytanie, opinię lub problem.";

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>{children}</SheetTrigger>

            <SheetContent
                side="bottom"
                className="mx-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-white/10 bg-zinc-950 px-0 text-white"
            >
                <SheetHeader className="px-6 pb-2 pt-6 text-left">
                    <SheetTitle className="text-xl text-white">
                        {title}
                    </SheetTitle>
                    <SheetDescription className="text-white/60">
                        {description}
                    </SheetDescription>
                </SheetHeader>

                <form
                    className="space-y-5 px-6 pb-8 pt-4"
                    onSubmit={handleSubmit}
                >
                    {recipe && (
                        <label className="grid gap-2 text-sm font-medium">
                            Kategoria błędu
                            <select
                                value={category}
                                onChange={event => setCategory(
                                    event.target.value as ContactSubmission["category"],
                                )}
                                className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-white outline-none focus:border-lime-400"
                            >
                                {recipeCategories.map(item => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                        className="bg-zinc-950"
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className="grid gap-2 text-sm font-medium">
                        Twój e-mail <span className="font-normal text-white/50">(opcjonalnie)</span>
                        <Input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                            placeholder="abyśmy mogli odpowiedzieć"
                            className="h-11 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-medium">
                        Wiadomość
                        <Textarea
                            required
                            minLength={10}
                            maxLength={3_000}
                            value={message}
                            onChange={event => setMessage(event.target.value)}
                            placeholder={recipe
                                ? "Opisz, co wymaga poprawy."
                                : "W czym możemy pomóc?"}
                            className="min-h-32 border-white/15 bg-white/5 text-white placeholder:text-white/40"
                        />
                    </label>

                    <input
                        ref={honeypotRef}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden
                        className="absolute -left-[9999px]"
                        name="company"
                    />

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="h-11 w-full bg-lime-400 font-semibold text-black hover:bg-lime-300"
                    >
                        {isPending ? "Wysyłanie..." : "Wyślij wiadomość"}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
