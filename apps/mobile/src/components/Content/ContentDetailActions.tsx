import {useState} from "react";
import {ActivityIndicator, Pressable, Share, View} from "react-native";
import {Heart, Share2} from "lucide-react-native";
import {useMutation, useQuery, useConvexAuth} from "convex/react";
import {useRouter} from "expo-router";

import {api} from "@gotujto/convex/_generated/api";
import type {Id} from "@gotujto/convex/_generated/dataModel";
import {Text} from "@/components/ui/text";
import {useToast} from "@/components/ui/toast";

type ContentDetailActionsProps =
    | {target: "recipe"; contentId: Id<"recipes">; title: string}
    | {target: "blog"; contentId: Id<"blog">; title: string};

function getErrorMessage(error: unknown) {
    return error instanceof Error && error.message
        ? error.message
        : "Nie udalo sie wykonac tej operacji. Sprobuj ponownie.";
}

export default function ContentDetailActions(props: ContentDetailActionsProps) {
    const router = useRouter();
    const {toast} = useToast();
    const {isAuthenticated, isLoading} = useConvexAuth();
    const [isFavoritePending, setIsFavoritePending] = useState(false);
    const recipeFavorite = useQuery(
        api.userDashboard.getFavoriteState,
        props.target === "recipe" && isAuthenticated
            ? {recipeId: props.contentId}
            : "skip",
    );
    const blogFavorite = useQuery(
        api.userDashboard.getBlogFavoriteState,
        props.target === "blog" && isAuthenticated
            ? {blogId: props.contentId}
            : "skip",
    );
    const toggleRecipeFavorite = useMutation(api.userDashboard.toggleFavoriteRecipe);
    const toggleBlogFavorite = useMutation(api.userDashboard.toggleFavoriteBlog);
    const isFavorite = props.target === "recipe"
        ? recipeFavorite === true
        : blogFavorite === true;

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
        } catch (error) {
            toast({title: getErrorMessage(error), variant: "destructive"});
        } finally {
            setIsFavoritePending(false);
        }
    }

    async function handleShare() {
        const siteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");
        const path = props.target === "recipe"
            ? `/recipe/${props.contentId}`
            : `/blog/${props.contentId}`;
        const url = siteUrl ? `${siteUrl}${path}` : undefined;

        try {
            await Share.share({
                title: props.title,
                message: url
                    ? `Zobacz w GotujTo: ${props.title}\n${url}`
                    : `Zobacz w GotujTo: ${props.title}`,
                ...(url ? {url} : {}),
            });
        } catch (error) {
            toast({title: getErrorMessage(error), variant: "destructive"});
        }
    }

    return (
        <View className="flex-row items-center gap-2">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? "Usun z ulubionych" : "Dodaj do ulubionych"}
                accessibilityState={{selected: isFavorite, disabled: isLoading || isFavoritePending}}
                disabled={isLoading || isFavoritePending}
                onPress={() => void handleFavorite()}
                className="h-10 flex-row items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 active:bg-white/10 disabled:opacity-45"
            >
                {isFavoritePending ? (
                    <ActivityIndicator size="small" color="#a3e635" />
                ) : (
                    <Heart
                        size={18}
                        color={isFavorite ? "#a3e635" : "#ffffff"}
                        fill={isFavorite ? "#a3e635" : "transparent"}
                    />
                )}
                <Text className="text-sm font-semibold text-white">
                    {isFavorite ? "Zapisano" : "Ulubione"}
                </Text>
            </Pressable>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Udostepnij"
                onPress={() => void handleShare()}
                className="h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 active:bg-white/10"
            >
                <Share2 size={18} color="#ffffff" />
            </Pressable>
        </View>
    );
}
