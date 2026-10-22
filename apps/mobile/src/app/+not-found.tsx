import {Pressable, View} from "react-native";
import {useRouter} from "expo-router";
import {House, SearchX} from "lucide-react-native";

import {Text} from "@/components/ui/text";

export default function NotFoundScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 items-center justify-center bg-black px-6">
            <View className="size-16 items-center justify-center rounded-full bg-lime-400/15">
                <SearchX size={30} color="#a3e635" />
            </View>
            <Text className="mt-5 text-center text-2xl font-bold text-white">
                Nie znaleźliśmy tej strony
            </Text>
            <Text className="mt-2 max-w-xs text-center text-sm leading-6 text-white/60">
                Link może być nieaktualny albo treść została usunięta.
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/" as never)}
                className="mt-8 flex-row items-center gap-2 rounded-full bg-lime-400 px-5 py-3 active:bg-lime-300"
            >
                <House size={18} color="#111827" />
                <Text className="font-semibold text-neutral-950">Wróć do głównej</Text>
            </Pressable>
        </View>
    );
}
