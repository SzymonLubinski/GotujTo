import {ActivityIndicator, View} from "react-native";
import {Clapperboard} from "lucide-react-native";
import {Text} from "@/components/ui/text";

type VideoLoadingPlaceholderProps = {
    showIndicator?: boolean;
};

export default function VideoLoadingPlaceholder({showIndicator = false}: VideoLoadingPlaceholderProps) {
    return (
        <View className="h-full w-full items-center justify-center bg-neutral-950">
            <View className="items-center gap-4">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    {showIndicator ? (
                        <ActivityIndicator size="small"
                                           color="#f97316"
                        />
                    ) : (
                        <Clapperboard size={28}
                                      color="#a3a3a3"
                        />
                    )}
                </View>

                <Text className="text-sm text-neutral-400">
                    Ładowanie filmu...
                </Text>
            </View>
        </View>
    );
}