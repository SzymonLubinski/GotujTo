import {useMemo, useState} from "react";
import {ActivityIndicator, FlatList, Pressable, useWindowDimensions, View} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useQuery} from "convex/react";
import {Image} from "expo-image";
import {ArrowLeft, BookOpenText, ChefHat, Clock, UserRound, Users} from "lucide-react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import type {FunctionReturnType} from "convex/server";

import {api} from "@gotujto/convex/_generated/api";
import ContentMediaCarousel from "@/components/Content/ContentMediaCarousel";
import ShortActions from "@/components/Shorts/ShortActions";
import {Text} from "@/components/ui/text";

type PublicProfileResult = NonNullable<FunctionReturnType<typeof api.userDashboard.getPublicProfile>>;
type PublicRecipe = PublicProfileResult["recipes"][number];
type PublicBlog = PublicProfileResult["blogPosts"][number];
type PublicTab = "recipes" | "blog";

const blogTypeLabels = {
    tip: "Porada",
    article: "Artykul",
    joke: "Ciekawostka",
};

export default function PublicProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {width, height} = useWindowDimensions();
    const {userId: userIdParam} = useLocalSearchParams<{userId?: string | string[]}>();
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const result = useQuery(
        api.userDashboard.getPublicProfile,
        userId ? {userId} : "skip",
    );
    const [activeTab, setActiveTab] = useState<PublicTab>("recipes");
    const shortHeight = Math.max(height - insets.top - 166, 360);
    const items = useMemo(
        () => activeTab === "recipes" ? result?.recipes ?? [] : result?.blogPosts ?? [],
        [activeTab, result?.blogPosts, result?.recipes],
    );

    if (!userId || result === undefined) {
        return <LoadingScreen />;
    }

    if (result === null) {
        return (
            <View className="flex-1 items-center justify-center bg-black px-6">
                <Text className="text-center text-xl font-bold text-white">Nie znaleziono profilu autora.</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <View className="border-b border-white/10 px-5 pb-3" style={{paddingTop: insets.top + 8}}>
                <View className="flex-row items-center gap-4">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Wroc"
                        onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
                    >
                        <ArrowLeft size={21} color="#ffffff" />
                    </Pressable>
                    <View className="size-12 overflow-hidden rounded-full border border-lime-300/30 bg-lime-400/10">
                        {result.profile.image ? (
                            <Image source={{uri: result.profile.image}} style={{width: "100%", height: "100%"}} contentFit="cover" />
                        ) : (
                            <View className="flex-1 items-center justify-center"><UserRound size={24} color="#a3e635" /></View>
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs font-medium text-lime-300">Profil autora</Text>
                        <Text className="text-xl font-bold text-white" numberOfLines={1}>{result.profile.name}</Text>
                    </View>
                </View>
                <View className="mt-4 flex-row gap-2">
                    <ProfileTabButton active={activeTab === "recipes"} label={`Przepisy (${result.recipes.length})`} onPress={() => setActiveTab("recipes")} />
                    <ProfileTabButton active={activeTab === "blog"} label={`Blog (${result.blogPosts.length})`} onPress={() => setActiveTab("blog")} />
                </View>
            </View>

            {items.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-center text-sm leading-6 text-white/55">Ten autor nie ma jeszcze opublikowanych {activeTab === "recipes" ? "przepisow" : "wpisow"}.</Text>
                </View>
            ) : activeTab === "recipes" ? (
                <FlatList<PublicRecipe>
                    data={result.recipes}
                    keyExtractor={item => item._id}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    decelerationRate="fast"
                    renderItem={({item}) => <PublicRecipeShort recipe={item} width={width} height={shortHeight} />}
                    getItemLayout={(_, index) => ({length: shortHeight, offset: shortHeight * index, index})}
                />
            ) : (
                <FlatList<PublicBlog>
                    data={result.blogPosts}
                    keyExtractor={item => item._id}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    decelerationRate="fast"
                    renderItem={({item}) => <PublicBlogShort blog={item} width={width} height={shortHeight} />}
                    getItemLayout={(_, index) => ({length: shortHeight, offset: shortHeight * index, index})}
                />
            )}
        </View>
    );
}

function ProfileTabButton({active, label, onPress}: {active: boolean; label: string; onPress: () => void}) {
    return (
        <Pressable
            accessibilityRole="tab"
            accessibilityState={{selected: active}}
            onPress={onPress}
            className={active ? "flex-1 items-center rounded-full bg-lime-400 px-3 py-2.5" : "flex-1 items-center rounded-full border border-white/10 bg-white/5 px-3 py-2.5"}
        >
            <Text className={active ? "text-sm font-semibold text-neutral-950" : "text-sm font-semibold text-white/80"}>{label}</Text>
        </Pressable>
    );
}

function PublicRecipeShort({recipe, width, height}: {recipe: PublicRecipe; width: number; height: number}) {
    const router = useRouter();

    return (
        <View style={{width, height}} className="overflow-hidden bg-neutral-950">
            <ContentMediaCarousel contentId={recipe._id} images={recipe.images} videoUrl={recipe.videoUrl} width={width} height={height} />
            <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 bg-black/70 px-5 pb-7 pt-14">
                <View className="mb-3 flex-row items-center gap-2"><ChefHat size={17} color="#a3e635" /><Text className="text-sm font-semibold uppercase tracking-wider text-lime-300">Przepis</Text></View>
                <Pressable accessibilityRole="link" onPress={() => router.push(`/recipe/${recipe._id}` as never)}>
                    <Text className="max-w-[76%] text-2xl font-bold leading-8 text-white" numberOfLines={2}>{recipe.name}</Text>
                </Pressable>
                {recipe.description ? <Text className="mt-3 max-w-[76%] text-sm leading-6 text-white/75" numberOfLines={3}>{recipe.description}</Text> : null}
                <View className="mt-4 flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1.5"><Clock size={16} color="#ffffff" /><Text className="text-sm font-medium text-white">{recipe.cookingMinutes} min</Text></View>
                    <View className="flex-row items-center gap-1.5"><Users size={16} color="#ffffff" /><Text className="text-sm font-medium text-white">{recipe.servings} porcji</Text></View>
                </View>
            </View>
            <ShortActions target="recipe" contentId={recipe._id} title={recipe.name} favoriteCount={recipe.favoriteCount} commentCount={recipe.commentCount} />
        </View>
    );
}

function PublicBlogShort({blog, width, height}: {blog: PublicBlog; width: number; height: number}) {
    const router = useRouter();

    return (
        <View style={{width, height}} className="overflow-hidden bg-neutral-950">
            <ContentMediaCarousel contentId={blog._id} images={blog.images} videoUrl={blog.videoUrl} width={width} height={height} />
            <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 bg-black/70 px-5 pb-7 pt-14">
                <View className="mb-3 flex-row items-center gap-2"><BookOpenText size={17} color="#fb923c" /><Text className="text-sm font-semibold uppercase tracking-wider text-orange-400">Blog · {blogTypeLabels[blog.type]}</Text></View>
                <Pressable accessibilityRole="link" onPress={() => router.push(`/blog/${blog._id}` as never)}>
                    <Text className="max-w-[76%] text-2xl font-bold leading-8 text-white" numberOfLines={2}>{blog.title}</Text>
                </Pressable>
                <Text className="mt-3 max-w-[76%] text-sm leading-6 text-white/75" numberOfLines={4}>{blog.description}</Text>
            </View>
            <ShortActions target="blog" contentId={blog._id} title={blog.title} favoriteCount={blog.favoriteCount} commentCount={blog.commentCount} />
        </View>
    );
}

function LoadingScreen() {
    return <View className="flex-1 items-center justify-center bg-black"><ActivityIndicator color="#a3e635" /></View>;
}
