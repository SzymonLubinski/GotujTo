import {useMemo, useState} from "react";
import {FlatList, Pressable, View} from "react-native";
import {Image} from "expo-image";
import {BookOpen, Lightbulb, Smile, UserRound} from "lucide-react-native";
import {type BlogShortsFeedItem} from "@gotujto/shared/types/result-type";
import {Text} from "@/components/ui/text";
import ShortsVideo from "@/components/Shorts/ShortsVideo";
import {useRouter} from "expo-router";
import ShortActions from "@/components/Shorts/ShortActions";
import ShortBackground from "@/components/Shorts/ShortBackground";
import ShortTitleBackground from "@/components/Shorts/ShortTitleBackground";

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
    const router = useRouter();
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const blog = item.data;

    const media = useMemo<BlogMedia[]>(
        () => [
            ...(blog.videoUrl
                ? [{type: "video" as const, uri: blog.videoUrl}]
                : []),
            ...blog.images.map(uri => ({
                type: "image" as const,
                uri,
            })),
        ],
        [blog.images, blog.videoUrl],
    );

    const label = blog.type === "tip"
        ? "Porada"
        : blog.type === "article"
            ? "Artykuł"
            : "Na poprawę humoru";

    const LabelIcon = blog.type === "tip"
        ? Lightbulb
        : blog.type === "article"
            ? BookOpen
            : Smile;

    return (
        <View style={{width, height}} className="overflow-hidden bg-neutral-950">
            <ShortBackground />

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
                        <View
                            style={{
                                width,
                                height,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <View style={{width, height: height * 0.7}}>
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
                                    style={{width, height: height * 0.7}}
                                    contentFit="contain"
                                    cachePolicy="memory-disk"
                                />
                            )}
                            </View>
                        </View>
                    )}
                />
            ) : (
                <View className="h-full w-full bg-neutral-950" />
            )}

            <ShortTitleBackground />
            <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 px-5 pb-24 pt-16">
                <View className="mb-3 flex-row items-center gap-2">
                    <LabelIcon size={17} color="#fb923c" />
                    <Text className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                        {label}
                    </Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Otwórz wpis: ${blog.title}`}
                    onPress={() => router.push({
                        pathname: "/blog/[blogId]" as never,
                        params: {blogId: blog._id},
                    })}
                >
                    <Text className="max-w-[78%] text-2xl font-bold leading-8 text-white">
                        {blog.title}
                    </Text>
                </Pressable>

                <Text className="mt-3 max-w-[78%] text-base leading-6 text-white/70" numberOfLines={4}>
                    {blog.excerpt}
                </Text>
                <Pressable
                    accessibilityRole={blog.authorUserId ? "link" : undefined}
                    disabled={!blog.authorUserId}
                    onPress={() => blog.authorUserId && router.push(`/u/${blog.authorUserId}` as never)}
                    className="mt-4 flex-row items-center gap-2 disabled:opacity-100"
                >
                    <UserRound size={16} color="rgba(255,255,255,0.8)" />
                    <Text className={blog.authorUserId ? "text-sm font-medium text-lime-300" : "text-sm font-medium text-white/85"}>
                        {blog.authorName}
                    </Text>
                </Pressable>
            </View>

            <ShortActions
                target="blog"
                contentId={blog._id}
                title={blog.title}
                favoriteCount={blog.favoriteCount ?? 0}
                commentCount={blog.commentCount ?? 0}
            />
        </View>
    );
}
