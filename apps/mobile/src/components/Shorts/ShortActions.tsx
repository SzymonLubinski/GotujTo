import {useMemo, useState, type ReactNode} from "react";
import {ActivityIndicator, Modal, Pressable, ScrollView, Share, View} from "react-native";
import {Heart, MessageCircle, Share2, X} from "lucide-react-native";
import {useMutation, useQuery, useConvexAuth} from "convex/react";
import {useRouter} from "expo-router";

import {api} from "@gotujto/convex/_generated/api";
import type {Id} from "@gotujto/convex/_generated/dataModel";
import CommentsSection from "@/components/Comments/CommentsSection";
import {Text} from "@/components/ui/text";

type ShortActionsProps =
    | {target: "recipe"; contentId: Id<"recipes">; title: string; favoriteCount: number; commentCount: number}
    | {target: "blog"; contentId: Id<"blog">; title: string; favoriteCount: number; commentCount: number};

function formatCount(count: number) {
    return new Intl.NumberFormat("pl-PL", {notation: "compact", maximumFractionDigits: 1}).format(count);
}

export default function ShortActions(props: ShortActionsProps) {
    const router = useRouter();
    const {isAuthenticated, isLoading} = useConvexAuth();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isFavoritePending, setIsFavoritePending] = useState(false);
    const recipeFavorite = useQuery(
        api.userDashboard.getFavoriteState,
        props.target === "recipe" && isAuthenticated ? {recipeId: props.contentId} : "skip",
    );
    const blogFavorite = useQuery(
        api.userDashboard.getBlogFavoriteState,
        props.target === "blog" && isAuthenticated ? {blogId: props.contentId} : "skip",
    );
    const toggleRecipeFavorite = useMutation(api.userDashboard.toggleFavoriteRecipe);
    const toggleBlogFavorite = useMutation(api.userDashboard.toggleFavoriteBlog);
    const isFavorite = props.target === "recipe" ? recipeFavorite === true : blogFavorite === true;
    const contentPath = useMemo(
        () => props.target === "recipe" ? `/recipe/${props.contentId}` : `/blog/${props.contentId}`,
        [props.contentId, props.target],
    );

    async function handleFavorite() {
        if (!isAuthenticated) {
            router.push("/(tabs)/profile" as never);
            return;
        }

        setIsFavoritePending(true);
        try {
            if (props.target === "recipe") {
                await toggleRecipeFavorite({recipeId: props.contentId});
            } else {
                await toggleBlogFavorite({blogId: props.contentId});
            }
        } finally {
            setIsFavoritePending(false);
        }
    }

    async function handleShare() {
        const siteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");
        const url = siteUrl ? `${siteUrl}${contentPath}` : undefined;

        await Share.share({
            title: props.title,
            message: url ? `Zobacz w GotujTo: ${props.title}\n${url}` : `Zobacz w GotujTo: ${props.title}`,
            ...(url ? {url} : {}),
        });
    }

    return (
        <>
            <View pointerEvents="box-none" className="absolute right-3 top-1/2 z-30 -translate-y-1/2 items-center gap-4">
                <ActionWithCount
                    label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                    count={props.favoriteCount}
                    disabled={isLoading || isFavoritePending}
                    onPress={() => void handleFavorite()}
                >
                    {isFavoritePending ? <ActivityIndicator color="#ffffff" /> : (
                        <Heart size={27} color={isFavorite ? "#a3e635" : "#ffffff"} fill={isFavorite ? "#a3e635" : "transparent"} strokeWidth={2.6} />
                    )}
                </ActionWithCount>
                <ActionWithCount label="Otwórz komentarze" count={props.commentCount} onPress={() => setIsCommentsOpen(true)}>
                    <MessageCircle size={27} color="#ffffff" strokeWidth={2.6} />
                </ActionWithCount>
                <Pressable accessibilityRole="button" accessibilityLabel="Udostępnij" hitSlop={10} onPress={() => void handleShare()} className="items-center py-1 active:opacity-60">
                    <Share2 size={27} color="#ffffff" strokeWidth={2.6} />
                </Pressable>
            </View>

            <Modal visible={isCommentsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsCommentsOpen(false)}>
                <View className="flex-1 bg-black">
                    <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
                        <Text className="text-lg font-bold text-white">Komentarze</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Zamknij komentarze" hitSlop={10} onPress={() => setIsCommentsOpen(false)} className="rounded-full p-2 active:bg-white/10">
                            <X size={22} color="#ffffff" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                    <ScrollView className="flex-1" contentContainerClassName="px-5 pb-12">
                        {props.target === "recipe" ? <CommentsSection target="recipe" contentId={props.contentId} /> : <CommentsSection target="blog" contentId={props.contentId} />}
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
}

function ActionWithCount({children, count, label, disabled, onPress}: {children: ReactNode; count: number; label: string; disabled?: boolean; onPress: () => void}) {
    return (
        <View className="items-center">
            <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} hitSlop={10} onPress={onPress} className="items-center py-1 active:opacity-60 disabled:opacity-45">
                {children}
            </Pressable>
            <Text className="-mt-0.5 text-xs font-semibold text-white">{formatCount(count)}</Text>
        </View>
    );
}
