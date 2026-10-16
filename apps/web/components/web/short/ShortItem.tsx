import type { RefObject } from "react"
import RecipeMediaCarousel from "./RecipeMediaCarousel"
import FridgeContent from "@/components/web/short/FridgeContent"
import DealContent from "@/components/web/short/DealContent"
import {ShortItemData} from "@gotujto/shared/types/result-type";
import ShortItemFooter from "@/components/web/short/ShortItemFooter";
import StandardContent from "@/components/web/short/StandardContent";
import {RecipeShortActions} from "@/components/web/short/RecipeShortActions";


type ShortItemProps = {
    item: ShortItemData;
    index: number;
    isActive: boolean;
    isNearby: boolean;
    isMuted: boolean;
    isLastLoaded: boolean;
    loadTriggerRef: RefObject<HTMLElement | null>;
    onMutedChange: (muted: boolean) => void;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836"

export default function ShortItem({ item, index, isActive, isNearby, isMuted, isLastLoaded, loadTriggerRef, onMutedChange}: ShortItemProps) {
    const { recipe, source } = item
    const images = recipe.images.length > 0 ? recipe.images : [FALLBACK_IMAGE]
    const isFirstRecipe = index === 0


    return (
        <article ref={isLastLoaded ? loadTriggerRef : undefined} data-short-index={index} className="relative mx-auto h-full w-full max-w-md snap-start snap-always overflow-hidden bg-black">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(132,204,22,0.18),transparent_42%),linear-gradient(160deg,#18181b_0%,#09090b_52%,#020202_100%)]" />

            <div className="absolute inset-0 z-10">
                <RecipeMediaCarousel name={recipe.name} images={images} videoUrl={recipe.videoKey ?? null} isActive={isActive} isNearby={isNearby} isMuted={isMuted} onMutedChange={onMutedChange} priority={isFirstRecipe} />
            </div>

            {source === "deals" && (
                <DealContent
                    dealIngredientCount={item.dealIngredientCount ?? item.matchedGroups}
                    dealStores={item.dealStores}
                    thrift={item.thrift}
                >
                    <ShortItemFooter
                        item={item}
                        fridgeProductIds={item.fridgeProductIds}
                        dealProductIds={item.dealProductIds}
                    />
                </DealContent>
            )}

            {source === "fridge" && (
                <FridgeContent
                    matchPercentage={item.matchPercentage}
                    matchedGroups={item.matchedGroups}
                    requiredGroups={item.requiredGroups}
                >
                    <ShortItemFooter
                        item={item}
                        fridgeProductIds={item.fridgeProductIds}
                        dealProductIds={item.dealProductIds}
                    />
                </FridgeContent>
            )}

            {source === "standard" && (
                <StandardContent>
                    <ShortItemFooter item={item}
                                     fridgeProductIds={item.fridgeProductIds}
                                     dealProductIds={item.dealProductIds}
                    />
                </StandardContent>
            )}

            <RecipeShortActions
                recipeId={recipe._id}
                recipeName={recipe.name}
                favoriteCount={recipe.favoriteCount ?? 0}
                commentCount={recipe.commentCount ?? 0}
            />
        </article>
    )
}
