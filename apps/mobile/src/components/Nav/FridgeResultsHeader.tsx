import {Pressable, View} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {ArrowLeft, ChefHat} from "lucide-react-native";
import {Text} from "@/components/ui/text";

type FridgeResultsHeaderProps = {
    resultsCount: number;
};

export default function FridgeResultsHeader({resultsCount}: FridgeResultsHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace("/fridge");
    };

    return (
        <View className="absolute inset-x-0 top-0 z-30 px-4"
              style={{paddingTop: insets.top + 8}}
              pointerEvents="box-none"
        >
            <View className="min-h-16 flex-row items-center rounded-2xl border border-white/10 bg-black/75 px-3 py-2">
                <Pressable accessibilityRole="button"
                           accessibilityLabel="Wróć do lodówki"
                           className="h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
                           onPress={handleBack}
                >
                    <ArrowLeft size={22} color="white" />
                </Pressable>

                <View className="flex-1 flex-row items-center justify-center gap-2 px-2">
                    <ChefHat size={20} color="#a3e635" />

                    <Text className="shrink text-center text-sm font-semibold text-white"
                          numberOfLines={2}
                    >
                        {getResultsMessage(resultsCount)}
                    </Text>
                </View>

                <View className="h-11 w-11" />
            </View>
        </View>
    );
}

function getResultsMessage(resultsCount: number): string {
    if (resultsCount === 1) {
        return "Znaleźliśmy 1 dopasowany przepis";
    }

    const lastDigit = resultsCount % 10;
    const lastTwoDigits = resultsCount % 100;
    const usesPluralForm = lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14);

    if (usesPluralForm) {
        return `Znaleźliśmy ${resultsCount} dopasowane przepisy`;
    }

    return `Znaleźliśmy ${resultsCount} dopasowanych przepisów`;
}