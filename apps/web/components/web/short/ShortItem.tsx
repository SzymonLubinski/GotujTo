import type { RefObject } from "react"
import Image from "next/image"
import RecipeMediaCarousel from "./RecipeMediaCarousel"
import FridgeContent from "@/components/web/short/FridgeContent"
import DealContent from "@/components/web/short/DealContent"
import {ShortItemData} from "@gotujto/shared/types/result-type";
import ShortItemFooter from "@/components/web/short/ShortItemFooter";
import StandardContent from "@/components/web/short/StandardContent";


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
            <Image src={images[0]} alt="" aria-hidden fill sizes="(max-width: 768px) 100vw, 448px" priority={isFirstRecipe} className="scale-110 object-cover blur-2xl brightness-50" />

            <div className="absolute inset-0 bg-black/25" />

            <div className="absolute inset-0 z-10">
                <RecipeMediaCarousel name={recipe.name} images={images} videoUrl={recipe.videoKey ?? null} isActive={isActive} isNearby={isNearby} isMuted={isMuted} onMutedChange={onMutedChange} priority={isFirstRecipe} />
            </div>

            {source === "deals" && (
                <DealContent
                    matchedGroups={item.matchedGroups}
                    requiredGroups={item.requiredGroups}
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
        </article>
    )
}