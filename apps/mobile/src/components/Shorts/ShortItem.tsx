import {View} from "react-native";
import {ShortItemData} from "@gotujto/shared/types/result-type";
import ShortMediaCarousel from "./ShortMediaCarousel";
import ShortContent from "@/components/Shorts/ShortContent";
import {useRouter} from "expo-router";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {navigateAfterBlur} from "@/lib/navigation";
import ShortActions from "@/components/Shorts/ShortActions";
import ShortBackground from "@/components/Shorts/ShortBackground";

type ShortItemProps = {
    item: ShortItemData;
    width: number;
    height: number;
    isActive: boolean;
    isMuted: boolean;
    onMutedChange: (muted: boolean) => void;
    productIds?: Id<"products">[];
};

export default function ShortItem({item, width, height, isActive, productIds, isMuted, onMutedChange}: ShortItemProps) {
    const {recipe} = item;
    const router = useRouter();

    const handleOpenRecipe = () => {
        navigateAfterBlur(() => {
            router.push({
                pathname: "/recipe/[recipeId]",
                params: {
                    recipeId: item.recipe._id,
                    ...(productIds?.length
                            ? {
                                productId: productIds.join(","),
                            }
                            : {}
                    ),
                },
            });
        })
    };

    return (
        <View className="relative overflow-hidden bg-black"
              style={{width, height}}
        >
            <ShortBackground
                imageUrl={recipe.images?.[0]}
                hasVideo={Boolean(recipe.videoKey)}
            />

            <ShortMediaCarousel recipe={recipe}
                                width={width}
                                height={height}
                                isActive={isActive}
                                isMuted={isMuted}
                                onMutedChange={onMutedChange}
            />

            <ShortContent item={item}
                          onOpenRecipe={handleOpenRecipe}
            />

            <ShortActions
                target="recipe"
                contentId={recipe._id}
                title={recipe.name}
                favoriteCount={recipe.favoriteCount ?? 0}
                commentCount={recipe.commentCount ?? 0}
            />
        </View>
    );
}
