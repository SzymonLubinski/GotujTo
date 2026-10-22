import {Text, View} from "react-native";
import {Store} from "lucide-react-native";
import {type ShortItemData} from "@gotujto/shared/types/result-type";
import StandardContent from "./StandardContent";

type DealItem = Extract<ShortItemData, {source: "deals"}>;

type DealContentProps = {
    item: DealItem;
    onOpenRecipe: () => void;
};

export default function DealContent({item, onOpenRecipe}: DealContentProps) {
    const matchedCount = getGroupCount(item.dealIngredientCount ?? item.matchedGroups);
    const thrift = item.thrift ?? 0;
    const stores = Array.isArray(item.dealStores) ? [...new Set(item.dealStores)] : [];
    const topContent = (
        <View className="max-w-[85%] rounded-2xl border border-white/15 bg-black/70 px-4 py-3">
            {thrift > 0 && (
                <Text className="text-lg font-bold text-lime-300">
                    Taniej do {formatSavings(thrift)}!
                </Text>
            )}
            <Text className={thrift > 0 ? "mt-1 text-sm font-medium text-white/90" : "text-sm font-medium text-white/90"}>
                W promocji: {matchedCount} {getIngredientLabel(matchedCount)}
            </Text>
            {stores.length > 0 && (
                <View className="mt-2 flex-row items-center gap-1.5">
                    <Store size={14} color="#bef264" />
                    <Text className="flex-1 text-xs text-white/75" numberOfLines={2}>
                        {stores.join(", ")}
                    </Text>
                </View>
            )}
        </View>
    )
    return (
        <StandardContent recipe={item.recipe}
                         topContent={topContent}
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

function getIngredientLabel(count: number) {
    if (count === 1) return "składnik";
    if (count >= 2 && count <= 4) return "składniki";
    return "składników";
}

function formatSavings(value: number) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
}
