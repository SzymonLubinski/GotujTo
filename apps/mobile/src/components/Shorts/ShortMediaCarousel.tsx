import {useMemo, useState} from "react";
import {FlatList, Text, View} from "react-native";
import {Image} from "expo-image";
import {ShortItemData} from "@gotujto/shared/types/result-type";
import ShortsVideo from "./ShortsVideo";
import VideoLoadingPlaceholder from "./VideoLoadingPlaceholder";


type ShortMediaCarouselProps = {
    recipe: ShortItemData["recipe"];
    width: number;
    height: number;
    isActive: boolean;
    isMuted: boolean;
    onMutedChange: (muted: boolean) => void;
};

type ShortMedia = {
    type: "video" | "image";
    uri: string;
};

export default function ShortMediaCarousel({recipe, width, height, isActive, isMuted, onMutedChange}: ShortMediaCarouselProps) {
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);

    const media = useMemo<ShortMedia[]>(
        () => [
            ...(recipe.videoKey
                ? [{
                    type: "video" as const,
                    uri: recipe.videoKey,
                }]
                : []),
            ...(recipe.images ?? []).map((image: string) => ({
                type: "image" as const,
                uri: image,
            })),
        ],
        [recipe.images, recipe.videoKey],
    );

    if (media.length === 0) {
        return (
            <View className="h-full w-full items-center justify-center bg-neutral-900">
                <Text className="text-white">
                    Brak mediów
                </Text>
            </View>
        );
    }

    return (
        <FlatList<ShortMedia>
            data={media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={2}
            removeClippedSubviews
            keyExtractor={(item, index) =>
                `${recipe._id}-${item.type}-${index}`
            }
            onMomentumScrollEnd={(event) => {
                const index = Math.round(
                    event.nativeEvent.contentOffset.x / width,
                );

                setActiveMediaIndex(index);
            }}
            renderItem={({item, index}) => {
                const shouldMountVideo =
                    item.type === "video" &&
                    isActive &&
                    activeMediaIndex === index;

                return (
                    <View style={{width, height}}>
                        {item.type === "video" ? (
                            shouldMountVideo ? (
                                <ShortsVideo uri={item.uri}
                                             isMuted={isMuted}
                                             onMutedChange={onMutedChange}
                                />
                            ) : (
                                <VideoLoadingPlaceholder />
                            )
                        ) : (
                            <Image source={{uri: item.uri}}
                                   style={{width, height}}
                                   contentFit="cover"
                                   cachePolicy="memory-disk"
                                   onError={({error}) => {
                                       console.error("Image failed:", {
                                           recipeId: recipe._id,
                                           uri: item.uri,
                                           error,
                                       });
                                   }}
                            />
                        )}
                    </View>
                );
            }}
        />
    );
}