import {ActivityIndicator, Pressable, ScrollView, useWindowDimensions, View} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useQuery} from "convex/react";
import {ArrowLeft, BookOpenText, CalendarDays, UserRound} from "lucide-react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {type Id} from "@gotujto/convex/_generated/dataModel";
import {api} from "@gotujto/convex/_generated/api";
import ContentMediaCarousel from "@/components/Content/ContentMediaCarousel";
import ContentDetailActions from "@/components/Content/ContentDetailActions";
import CommentsSection from "@/components/Comments/CommentsSection";
import {Text} from "@/components/ui/text";

const typeLabels = {
    tip: "Porada",
    article: "Artykuł",
    joke: "Ciekawostka",
};

export default function BlogDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {width} = useWindowDimensions();
    const {blogId: blogIdParam} = useLocalSearchParams<{blogId?: string | string[]}>();
    const blogIdValue = Array.isArray(blogIdParam) ? blogIdParam[0] : blogIdParam;
    const blogId = blogIdValue as Id<"blog"> | undefined;
    const blog = useQuery(api.blog.getBlogById, blogId ? {blogId} : "skip");

    if (!blogId || blog === undefined) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator size="large" color="#a3e635" />
                <Text className="mt-4 text-sm text-white/55">Ładowanie wpisu...</Text>
            </View>
        );
    }

    if (blog === null) {
        return (
            <View className="flex-1 items-center justify-center bg-black px-6">
                <Text className="text-center text-xl font-bold text-white">Nie znaleziono wpisu.</Text>
            </View>
        );
    }

    const hasMedia = Boolean(blog.videoUrl?.trim()) || blog.images.length > 0;
    const mediaHeight = Math.min(width * 1.25, 520);

    return (
        <ScrollView className="flex-1 bg-black" contentContainerStyle={{paddingBottom: 48}} keyboardShouldPersistTaps="always">
            <View className="relative bg-neutral-950" style={{height: hasMedia ? mediaHeight : insets.top + 64}}>
                {hasMedia && (
                    <ContentMediaCarousel
                        contentId={blog._id}
                        images={blog.images}
                        videoUrl={blog.videoUrl}
                        width={width}
                        height={mediaHeight}
                    />
                )}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Wróć"
                    className="absolute left-4 z-30 h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/65 active:bg-black/80"
                    style={{top: insets.top + 8}}
                    onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
                >
                    <ArrowLeft size={23} color="#ffffff" />
                </Pressable>
            </View>

            <View className="px-5 py-8">
                <View className="self-start flex-row items-center gap-2 rounded-full bg-lime-400 px-3 py-1.5">
                    <BookOpenText size={16} color="#111827" />
                    <Text className="text-sm font-semibold text-neutral-950">Blog · {typeLabels[blog.type]}</Text>
                </View>

                <View className="mt-4 flex-row items-start justify-between gap-3">
                    <Text className="flex-1 text-2xl font-bold leading-8 text-white">{blog.title}</Text>
                    <ContentDetailActions target="blog" contentId={blog._id} title={blog.title} />
                </View>

                <View className="mt-4 flex-row flex-wrap gap-x-5 gap-y-2">
                    <View className="flex-row items-center gap-2">
                        <CalendarDays size={17} color="rgba(255,255,255,0.7)" />
                        <Text className="text-sm text-white/70">{formatDate(blog.publishedAt)}</Text>
                    </View>
                    <Pressable
                        accessibilityRole={blog.authorUserId ? "link" : undefined}
                        disabled={!blog.authorUserId}
                        onPress={() => blog.authorUserId && router.push(`/u/${blog.authorUserId}` as never)}
                        className="flex-row items-center gap-2 disabled:opacity-100"
                    >
                        <UserRound size={17} color="rgba(255,255,255,0.7)" />
                        <Text className={blog.authorUserId ? "text-sm text-lime-300" : "text-sm text-white/70"}>{blog.authorName}</Text>
                    </Pressable>
                </View>

                <Text className="mt-8 text-base leading-8 text-zinc-200">{blog.description}</Text>

                <CommentsSection target="blog" contentId={blog._id} />
            </View>
        </ScrollView>
    );
}

function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat("pl-PL", {dateStyle: "long"}).format(timestamp);
}
