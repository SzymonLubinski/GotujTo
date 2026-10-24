import {useMemo, useState} from "react";
import {ActivityIndicator, FlatList, Pressable, useWindowDimensions, View} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useQuery} from "convex/react";
import {Image} from "expo-image";
import {ArrowLeft, Image as ImageIcon, Play, UserRound} from "lucide-react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import type {FunctionReturnType} from "convex/server";

import {api} from "@gotujto/convex/_generated/api";
import {Text} from "@/components/ui/text";

type PublicProfileResult = NonNullable<FunctionReturnType<typeof api.userDashboard.getPublicProfile>>;
type PublicRecipe = PublicProfileResult["recipes"][number];
type PublicBlog = PublicProfileResult["blogPosts"][number];
type PublicTab = "recipes" | "blog";

export default function PublicProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {width} = useWindowDimensions();
    const {userId: userIdParam} = useLocalSearchParams<{userId?: string | string[]}>();
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const result = useQuery(
        api.userDashboard.getPublicProfile,
        userId ? {userId} : "skip",
    );
    const [activeTab, setActiveTab] = useState<PublicTab>("recipes");
    const thumbnailWidth = Math.max((width - 24) / 2, 0);
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
                    keyboardShouldPersistTaps="always"
                    keyExtractor={item => item._id}
                    numColumns={2}
                    contentContainerStyle={{padding: 8, gap: 8}}
                    columnWrapperStyle={{gap: 8}}
                    showsVerticalScrollIndicator={false}
                    renderItem={({item}) => <PublicThumbnail
                        title={item.name}
                        image={item.images[0]}
                        hasVideo={!!item.videoUrl}
                        width={thumbnailWidth}
                        onPress={() => router.push(`/recipe/${item._id}` as never)}
                    />}
                />
            ) : (
                <FlatList<PublicBlog>
                    data={result.blogPosts}
                    keyboardShouldPersistTaps="always"
                    keyExtractor={item => item._id}
                    numColumns={2}
                    contentContainerStyle={{padding: 8, gap: 8}}
                    columnWrapperStyle={{gap: 8}}
                    showsVerticalScrollIndicator={false}
                    renderItem={({item}) => <PublicThumbnail
                        title={item.title}
                        image={item.images[0]}
                        hasVideo={!!item.videoUrl}
                        width={thumbnailWidth}
                        onPress={() => router.push(`/blog/${item._id}` as never)}
                    />}
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

function PublicThumbnail({title, image, hasVideo, width, onPress}: {title: string; image?: string; hasVideo: boolean; width: number; onPress: () => void}) {
    return (
        <Pressable accessibilityRole="link" accessibilityLabel={title} onPress={onPress} style={{width, aspectRatio: 1}} className="overflow-hidden rounded-lg bg-neutral-900">
            {image ? (
                <Image source={{uri: image}} style={{width: "100%", height: "100%"}} contentFit="cover" />
            ) : (
                <View className="flex-1 items-center justify-center"><ImageIcon size={30} color="rgba(255,255,255,0.4)" /></View>
            )}
            {hasVideo && <View className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5"><Play size={16} color="#fff" fill="#fff" /></View>}
            <View className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-2">
                <Text className="text-sm font-semibold text-white" numberOfLines={2}>{title}</Text>
            </View>
        </Pressable>
    );
}

function LoadingScreen() {
    return <View className="flex-1 items-center justify-center bg-black"><ActivityIndicator color="#a3e635" /></View>;
}
