import {type ReactNode} from "react";
import {Pressable, Text, View} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import {type ShortItemData} from "@gotujto/shared/types/result-type";

type StandardContentProps = {
    recipe: ShortItemData["recipe"];
    topContent?: ReactNode;
    sourceInfo?: ReactNode;
    onOpenRecipe: () => void;
};

export default function StandardContent({recipe, topContent, sourceInfo, onOpenRecipe}: StandardContentProps) {
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

            <View className="absolute inset-x-0 bottom-10 gap-3"
            >
                <View className="bg-neutral-950/50 p-4">
                    <Pressable accessibilityRole="button"
                               className="mt-3 items-center"
                               onPress={onOpenRecipe}
                    >
                        <Text className="text-2xl font-bold leading-4 text-white"
                              numberOfLines={2}
                        >
                            {recipe.name}
                        </Text>
                    </Pressable>
                    {sourceInfo}
                    <View className="mt-3 flex-row items-center gap-4">
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons name="time-outline" size={20} color="white"/>
                            <Text className="text-sm font-medium text-white">
                                {recipe.cookingMinutes} min
                            </Text>
                        </View>

                        <View className="flex-1 flex-row items-center gap-1.5">
                            <Entypo name="user" size={18} color="white"/>
                            <Text className="flex-1 text-sm font-medium text-white"
                                  numberOfLines={1}
                            >
                                {recipe.authorId}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}