import {useMemo, useState} from "react";
import {FlatList, View} from "react-native";
import {Image} from "expo-image";
import {BookOpen, Lightbulb, Smile} from "lucide-react-native";
import {type BlogShortsFeedItem} from "@gotujto/shared/types/result-type";
import {Text} from "@/components/ui/text";
import ShortsVideo from "@/components/Shorts/ShortsVideo";

type BlogShortItemProps = {
    item: BlogShortsFeedItem;
    width: number;
    height: number;
    isActive: boolean;
    isMuted: boolean;
    onMutedChange: (muted: boolean) => void;
};

type BlogMedia = {
    type: "video" | "image";
    uri: string;
};

export default function BlogShortItem({item, width, height, isActive, isMuted, onMutedChange}: BlogShortItemProps) {
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);

    const media = useMemo<BlogMedia[]>(
        () => [
            ...(item.videoKey
                ? [{type: "video" as const, uri: item.videoKey}]
                : []),
            ...item.images.map(uri => ({
                type: "image" as const,
                uri,
            })),
        ],
        [item.images, item.videoKey],
    );

    const label = item.blogType === "tip"
        ? "Porada"
        : item.blogType === "article"
            ? "Artykuł"
            : "Na poprawę humoru";

    const LabelIcon = item.blogType === "tip"
        ? Lightbulb
        : item.blogType === "article"
            ? BookOpen
            : Smile;

    return (
        <View style={{width, height}} className="overflow-hidden bg-neutral-950">
            {media.length > 0 ? (
                <FlatList<BlogMedia>
                    data={media}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(mediaItem, index) => `${item.id}-${mediaItem.type}-${index}`}
                    onMomentumScrollEnd={event => {
                        const nextIndex = Math.round(
                            event.nativeEvent.contentOffset.x / width,
                        );

                        setActiveMediaIndex(nextIndex);
                    }}
                    renderItem={({item: mediaItem, index}) => (
                        <View style={{width, height}}>
                            {mediaItem.type === "video" ? (
                                isActive && activeMediaIndex === index ? (
                                    <ShortsVideo
                                        uri={mediaItem.uri}
                                        isMuted={isMuted}
                                        onMutedChange={onMutedChange}
                                    />
                                ) : (
                                    <View className="h-full w-full bg-neutral-950" />
                                )
                            ) : (
                                <Image
                                    source={{uri: mediaItem.uri}}
                                    style={{width, height}}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                />
                            )}
                        </View>
                    )}
                />
            ) : (
                <View className="h-full w-full bg-neutral-950" />
            )}

            <View pointerEvents="none" className="absolute inset-x-0 bottom-0 bg-neutral-950/75 px-5 pb-24 pt-8">
                <View className="mb-3 flex-row items-center gap-2">
                    <LabelIcon size={17} color="#fb923c" />
                    <Text className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                        {label}
                    </Text>
                </View>

                <Text className="text-3xl font-bold leading-10 text-white">
                    {item.title}
                </Text>

                <Text className="mt-3 text-base leading-6 text-white/70">
                    {item.description}
                </Text>
            </View>
        </View>
    );
}