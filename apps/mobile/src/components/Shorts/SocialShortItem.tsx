import {Linking, Pressable, View} from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {type SocialShortsFeedItem} from "@gotujto/shared/types/result-type";
import {Text} from "@/components/ui/text";

type SocialShortItemProps = {
    item: SocialShortsFeedItem;
    width: number;
    height: number;
};

export default function SocialShortItem({item, width, height}: SocialShortItemProps) {
    const openUrl = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error("Cannot open social URL:", error);
        }
    };

    return (
        <View style={{width, height}} className="items-center justify-center bg-neutral-950 px-8">
            <View className="w-full max-w-md items-center rounded-3xl border border-white/10 bg-neutral-900/90 px-6 py-10">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-orange-500/15">
                    <FontAwesome6
                        name="instagram"
                        size={20}
                        color="#ffffff"
                    />
                </View>

                <Text className="mt-7 text-center text-3xl font-bold leading-10 text-white">
                    {item.title}
                </Text>

                <Text className="mt-3 text-center text-base leading-6 text-white/60">
                    {item.description}
                </Text>

                <View className="mt-8 w-full gap-3">
                    <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Otwórz Instagram GotujTo"
                        onPress={() => openUrl(item.instagramUrl)}
                        className="h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-orange-500 active:bg-orange-400 will-change-pressable"
                    >
                        <FontAwesome6
                            name="instagram"
                            size={20}
                            color="#ffffff"
                        />
                        <Text className="text-base font-semibold text-white">
                            Instagram
                        </Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Otwórz Facebook GotujTo"
                        onPress={() => openUrl(item.facebookUrl)}
                        className="h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-blue-600 active:bg-blue-500 will-change-pressable"
                    >
                        <FontAwesome6
                            name="facebook-f"
                            size={20}
                            color="#ffffff"
                        />
                        <Text className="text-base font-semibold text-white">
                            Facebook
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}