"use client";

import {Share2} from "lucide-react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";

type ShareButtonProps = {
    path: string;
    title: string;
    text: string;
};

export function ShareButton({path, title, text}: ShareButtonProps) {
    async function handleShare() {
        const url = `${window.location.origin}${path}`;

        try {
            if (navigator.share) {
                await navigator.share({title, text, url});
                return;
            }

            await navigator.clipboard.writeText(url);
            toast.success("Link został skopiowany.");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            toast.error("Nie udało się udostępnić.");
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Udostępnij"
            onClick={handleShare}
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Udostępnij</span>
        </Button>
    );
}
