"use client";

import {MessageCircle, Share2} from "lucide-react";
import {toast} from "sonner";

import type {Id} from "@gotujto/convex/_generated/dataModel";
import {FavoriteRecipeButton} from "@/components/web/recipe-card/FavoriteRecipeButton";
import {RecipeCommentsSheet} from "@/components/web/recipe-card/RecipeComments";
import {Button} from "@/components/ui/button";

type RecipeShortActionsProps = {
    recipeId: Id<"recipes">;
    recipeName: string;
    favoriteCount: number;
    commentCount: number;
};

function formatCount(count: number) {
    return new Intl.NumberFormat("pl-PL", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(count);
}

export function RecipeShortActions({recipeId, recipeName, favoriteCount, commentCount}: RecipeShortActionsProps) {
    async function shareRecipe() {
        const url = `${window.location.origin}/recipe/${recipeId}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: recipeName,
                    text: `Zobacz przepis: ${recipeName}`,
                    url,
                });
                return;
            }

            await navigator.clipboard.writeText(url);
            toast.success("Link do przepisu zostal skopiowany.");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            toast.error("Nie udalo sie udostepnic przepisu.");
        }
    }

    return (
        <aside aria-label="Akcje przepisu" className="pointer-events-auto absolute right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-4 text-white">
            <div className="flex flex-col items-center gap-0.5">
                <FavoriteRecipeButton recipeId={recipeId} appearance="short" />
                <span className="text-sm font-medium text-white/90">{formatCount(favoriteCount)}</span>
            </div>

            <RecipeCommentsSheet recipeId={recipeId} recipeName={recipeName}>
                <div className="flex flex-col items-center gap-0.5">
                    <Button type="button" variant="ghost" size="icon" aria-label="Otworz komentarze" className="size-8 rounded-full bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white">
                        <MessageCircle className="size-5.5 stroke-[2.5] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
                    </Button>
                    <span className="text-sm font-medium text-white/90">{formatCount(commentCount)}</span>
                </div>
            </RecipeCommentsSheet>

            <Button type="button" variant="ghost" size="icon" aria-label="Udostepnij przepis" className="size-8 rounded-full bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white" onClick={shareRecipe}>
                <Share2 className="size-5.5 stroke-[2.5] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
            </Button>
        </aside>
    );
}
