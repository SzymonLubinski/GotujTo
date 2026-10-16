"use client";

import {ArrowLeft} from "lucide-react";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";

export function PublicProfileBackButton() {
    const router = useRouter();

    function handleBack() {
        if (window.history.length > 1) {
            router.back();
            return;
        }

        router.push("/");
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/60 text-white hover:bg-white/10 hover:text-lime-300"
            aria-label="Wroc do poprzedniej strony"
        >
            <ArrowLeft className="size-5" />
        </Button>
    );
}
