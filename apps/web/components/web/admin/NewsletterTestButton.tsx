"use client";

import {useState, useTransition} from "react";
import {LoaderCircle, Send} from "lucide-react";

import {sendTestNewsletterAction} from "@/app/actions";
import {Button} from "@/components/ui/button";

export function NewsletterTestButton() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

    function handleClick() {
        setResult(null);
        startTransition(() => {
            void sendTestNewsletterAction().then(response => {
                setResult(response.success
                    ? {success: true, message: "Newsletter testowy zostal wyslany na skonfigurowany adres testowy."}
                    : {success: false, message: response.error});
            });
        });
    }

    return <div className="mt-4">
        <Button type="button" disabled={isPending} onClick={handleClick} className="w-full bg-lime-400 text-black hover:bg-lime-300">
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            Wyślij newsletter testowy
        </Button>
        {result && <p role="status" className={result.success ? "mt-3 text-sm text-lime-700 dark:text-lime-300" : "mt-3 text-sm text-red-600 dark:text-red-300"}>{result.message}</p>}
    </div>;
}
