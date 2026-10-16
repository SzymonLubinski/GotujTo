"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Heart, LoaderCircle} from "lucide-react";
import {useMutation, useQuery, useConvexAuth} from "convex/react";

import {api} from "@gotujto/convex/_generated/api";
import type {Id} from "@gotujto/convex/_generated/dataModel";
import {Button} from "@/components/ui/button";

type FavoriteBlogButtonProps = {
    blogId: Id<"blog">;
    appearance?: "default" | "short";
};

export function FavoriteBlogButton({blogId, appearance = "default"}: FavoriteBlogButtonProps) {
    const router = useRouter();
    const {isAuthenticated, isLoading} = useConvexAuth();
    const isFavorite = useQuery(
        api.userDashboard.getBlogFavoriteState,
        isAuthenticated ? {blogId} : "skip",
    );
    const toggleFavorite = useMutation(api.userDashboard.toggleFavoriteBlog);
    const [isPending, setIsPending] = useState(false);

    async function handleClick() {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        setIsPending(true);

        try {
            await toggleFavorite({blogId});
        } finally {
            setIsPending(false);
        }
    }

    const isSaved = isFavorite === true;
    const label = isSaved
        ? "Usuń z ulubionych"
        : "Dodaj do ulubionych";

    return (
        <Button
            type="button"
            variant="outline"
            size={appearance === "short" ? "icon" : "sm"}
            aria-label={label}
            aria-pressed={isSaved}
            disabled={isLoading || isPending}
            onClick={handleClick}
            className={appearance === "short"
                ? isSaved
                    ? "size-8 rounded-full border-0 bg-transparent text-lime-400 shadow-none hover:bg-lime-400/10 hover:text-lime-300"
                    : "size-8 rounded-full border-0 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white"
                : isSaved
                    ? "border-red-300/50 bg-red-400/10 text-red-200 hover:bg-red-400/20 hover:text-red-100"
                    : "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"}
        >
            {isPending ? <LoaderCircle className="size-5.5 animate-spin" /> : <Heart className={isSaved ? "size-5.5 fill-current stroke-[2.5]" : "size-5.5 stroke-[2.5] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"} />}
            {appearance === "default" && <span className="hidden sm:inline">{isSaved ? "Zapisano" : "Ulubione"}</span>}
        </Button>
    );
}
