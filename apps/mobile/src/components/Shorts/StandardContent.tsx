import {type ReactNode} from "react";
import {Pressable, Text, View} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useRouter} from "expo-router";
import {type ShortItemData} from "@gotujto/shared/types/result-type";

type StandardContentProps = {
    recipe: ShortItemData["recipe"];
    topContent?: ReactNode;
    sourceInfo?: ReactNode;
    onOpenRecipe: () => void;
};

export default function StandardContent({recipe, topContent, sourceInfo, onOpenRecipe}: StandardContentProps) {
    const router = useRouter();
    return (
        <View className="absolute inset-0"
              pointerEvents="box-none"
        >
            {topContent && (
                <View className="absolute inset-x-0 top-20 items-start px-5"
                      pointerEvents="none"
                >
                    {topContent}
                </View>
            )}

            <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 gap-3">
                <View pointerEvents="box-none" className="px-5 pb-24 pt-16">
                    <Pressable accessibilityRole="button"
                               className="max-w-[78%]"
                               onPress={onOpenRecipe}
                    >
                        <Text className="text-2xl font-bold leading-8 text-white"
                              numberOfLines={2}
                        >
                            {recipe.name}
                        </Text>
                    </Pressable>
                    {sourceInfo}
                    <View pointerEvents="box-none" className="mt-3 max-w-[78%] flex-row items-center gap-4">
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons name="time-outline" size={20} color="white"/>
                            <Text className="text-sm font-medium text-white">
                                {recipe.cookingMinutes} min
                            </Text>
                        </View>

                        <Pressable
                            accessibilityRole={recipe.authorUserId ? "link" : undefined}
                            disabled={!recipe.authorUserId}
                            onPress={() => recipe.authorUserId && router.push(`/u/${recipe.authorUserId}` as never)}
                            className="flex-1 flex-row items-center gap-1.5 disabled:opacity-100"
                        >
                            <Entypo name="user" size={18} color="white"/>
                            <Text className={recipe.authorUserId ? "flex-1 text-sm font-medium text-lime-300" : "flex-1 text-sm font-medium text-white"}
                                  numberOfLines={1}
                            >
                                {recipe.authorName ?? recipe.authorId}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}
