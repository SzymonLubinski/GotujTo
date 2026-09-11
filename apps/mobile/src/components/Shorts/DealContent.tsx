import {Text, View} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {type ShortItemData} from "@gotujto/shared/types/result-type";
import StandardContent from "./StandardContent";

type DealItem = Extract<ShortItemData, {source: "deals"}>;

type DealContentProps = {
    item: DealItem;
    onOpenRecipe: () => void;
};

export default function DealContent({item, onOpenRecipe}: DealContentProps) {
    const matchedCount = getGroupCount(item.matchedGroups);
    const requiredCount = getGroupCount(item.requiredGroups);
    const topContent = (
        <View className="flex-row items-center gap-2 rounded-full border border-orange-300/40 bg-orange-500/90 px-4 py-2">
            <Ionicons name="pricetag" size={18} color="white" />
            <Text className="text-sm font-bold uppercase tracking-wide text-white">
                Promocje
            </Text>
        </View>
    )
    const sourceInfo = (
        <View className="py-1">
            <Text className="font-semibold text-white">
                W promocji znajdziesz {matchedCount} z {requiredCount} wymaganych składników
            </Text>
        </View>
    )

    return (
        <StandardContent recipe={item.recipe}
                         topContent={topContent}
                         sourceInfo={sourceInfo}
                         onOpenRecipe={onOpenRecipe}
        />
    );
}

function getGroupCount(groups: unknown): number {
    if (Array.isArray(groups)) {
        return groups.length;
    }

    return typeof groups === "number" ? groups : 0;
}