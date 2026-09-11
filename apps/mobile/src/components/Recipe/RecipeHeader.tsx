
import {Pressable, useWindowDimensions, View} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {ArrowLeft} from "lucide-react-native";
import {type RecipeResultsType} from "@gotujto/shared/types/result-type";
import RecipeMediaCarousel from "@/components/Recipe/RecipeMediaCarousel";

type RecipeHeaderProps = {
    recipe: NonNullable<RecipeResultsType>["recipe"];
};

export default function RecipeHeader({recipe}: RecipeHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {width} = useWindowDimensions();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace("/");
    };
    const mediaHeight = Math.min(width * 1.25, 520);
    return (
        <View className="relative overflow-hidden bg-neutral-900" style={{height: mediaHeight}}>
            <RecipeMediaCarousel recipe={recipe}
                                 width={width}
                                 height={mediaHeight}
            />

            <Pressable accessibilityRole="button"
                       accessibilityLabel="Wróć"
                       className="absolute left-4 z-30 h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/65 active:bg-black/80"
                       style={{top: insets.top + 8}}
                       onPress={handleBack}
            >
                <ArrowLeft size={23}
                           color="#ffffff"
                />
            </Pressable>
        </View>
    );
}