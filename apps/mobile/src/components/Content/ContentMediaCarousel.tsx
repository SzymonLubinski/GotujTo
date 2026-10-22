import {useMemo, useState} from "react";
import {FlatList, Text, View} from "react-native";
import {Image} from "expo-image";
import {ChefHat} from "lucide-react-native";

import RecipeVideo from "@/components/Recipe/RecipeVideo";

type ContentMediaCarouselProps = {
    contentId: string;
    images: string[];
    videoUrl?: string | null;
    width: number;
    height: number;
};

type ContentMedia = {
    type: "video" | "image";
    uri: string;
};

export default function ContentMediaCarousel({
    contentId,
    images,
    videoUrl,
    width,
    height,
}: ContentMediaCarouselProps) {
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const media = useMemo<ContentMedia[]>(
        () => [
            ...(videoUrl ? [{type: "video" as const, uri: videoUrl}] : []),
            ...images.map(uri => ({type: "image" as const, uri})),
        ],
        [images, videoUrl],
    );

    if (media.length === 0) {
        return (
            <View className="items-center justify-center bg-neutral-900" style={{width, height}}>
                <ChefHat size={64} color="rgba(255, 255, 255, 0.25)" />
                <Text className="mt-3 text-sm text-white/40">Brak mediów</Text>
            </View>
        );
    }

    return (
        <View style={{width, height}}>
            <FlatList<ContentMedia>
                data={media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                keyExtractor={(item, index) => `${contentId}-${item.type}-${index}`}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                onMomentumScrollEnd={event => {
                    setActiveMediaIndex(Math.round(event.nativeEvent.contentOffset.x / width));
                }}
                renderItem={({item, index}) => (
                    <View style={{width, height}}>
                        {item.type === "video" ? (
                            activeMediaIndex === index ? (
                                <RecipeVideo uri={item.uri} />
                            ) : (
                                <View className="h-full w-full bg-neutral-950" />
                            )
                        ) : (
                            <Image
                                source={{uri: item.uri}}
                                style={{width, height}}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                transition={200}
                            />
                        )}
                    </View>
                )}
            />

            {media.length > 1 && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2" pointerEvents="none">
                    {media.map((item, index) => (
                        <View
                            key={`${item.type}-${index}`}
                            className={activeMediaIndex === index
                                ? "h-2 w-6 rounded-full bg-white"
                                : "h-2 w-2 rounded-full bg-white/40"}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
