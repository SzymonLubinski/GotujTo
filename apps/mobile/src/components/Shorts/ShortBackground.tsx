import {View} from "react-native";
import {Image} from "expo-image";

type ShortBackgroundProps = {
    imageUrl?: string;
    hasVideo: boolean;
};

/** Keeps contained media readable without cropping it into the background. */
export default function ShortBackground({imageUrl, hasVideo}: ShortBackgroundProps) {
    if (hasVideo) {
        return (
            <View pointerEvents="none" className="absolute inset-0 overflow-hidden bg-[#020504]">
                <View className="absolute -left-28 -top-28 size-80 rounded-full bg-lime-400/20" />
                <View className="absolute -right-32 top-1/3 size-96 rounded-full bg-emerald-700/25" />
                <View className="absolute -bottom-44 left-1/4 size-96 rounded-full bg-lime-700/15" />
                <View className="absolute inset-0 bg-black/55" />
            </View>
        );
    }

    if (imageUrl) {
        return (
            <View pointerEvents="none" className="absolute inset-0 overflow-hidden bg-black">
                <Image
                    source={{uri: imageUrl}}
                    className="absolute -inset-10 size-[120%]"
                    contentFit="cover"
                    blurRadius={42}
                    cachePolicy="memory-disk"
                />
                <View className="absolute inset-0 bg-black/50" />
            </View>
        );
    }

    return <View pointerEvents="none" className="absolute inset-0 bg-neutral-950" />;
}
