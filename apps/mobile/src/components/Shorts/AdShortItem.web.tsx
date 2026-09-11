import {View} from "react-native";
import {Text} from "@/components/ui/text";

export default function AdShortItem() {
    return (
        <View className="h-full w-full items-center justify-center bg-neutral-950 px-6">
            <View className="w-full rounded-3xl border border-white/10 bg-neutral-900 p-6">
                <Text className="text-xs font-semibold uppercase text-orange-400">
                    Reklama
                </Text>

                <Text className="mt-3 text-center text-sm text-white/45">
                    Reklamy testowe AdMob są dostępne tylko w aplikacji mobilnej.
                </Text>
            </View>
        </View>
    );
}