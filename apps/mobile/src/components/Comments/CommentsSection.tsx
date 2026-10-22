import {useState} from "react";
import {ActivityIndicator, Alert, Pressable, TextInput, View} from "react-native";
import {Flag, MessageCircle, Send, Trash2} from "lucide-react-native";
import {useMutation, useQuery, useConvexAuth} from "convex/react";
import {useRouter} from "expo-router";

import {type Id} from "@gotujto/convex/_generated/dataModel";
import {api} from "@gotujto/convex/_generated/api";
import {Avatar} from "@/components/ui/avatar";
import {Text} from "@/components/ui/text";
import {useToast} from "@/components/ui/toast";

type CommentsSectionProps =
    | {
        target: "recipe";
        contentId: Id<"recipes">;
    }
    | {
        target: "blog";
        contentId: Id<"blog">;
    };

function formatCommentDate(createdAt: number) {
    return new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(createdAt));
}

function getErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("wulgarn")) {
        return "Komentarz nie może zawierać wulgaryzmów.";
    }

    if (message.includes("RATE_LIMIT")) {
        return "Limit komentarzy został wykorzystany. Spróbuj ponownie później.";
    }

    return "Nie udało się wykonać tej operacji. Spróbuj ponownie.";
}

export default function CommentsSection({target, contentId}: CommentsSectionProps) {
    const router = useRouter();
    const {toast} = useToast();
    const {isAuthenticated, isLoading} = useConvexAuth();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const recipeComments = useQuery(
        api.userDashboard.getRecipeComments,
        target === "recipe" ? {recipeId: contentId} : "skip",
    );
    const blogComments = useQuery(
        api.userDashboard.getBlogComments,
        target === "blog" ? {blogId: contentId} : "skip",
    );
    const addRecipeComment = useMutation(api.userDashboard.addRecipeComment);
    const addBlogComment = useMutation(api.userDashboard.addBlogComment);
    const reportRecipeComment = useMutation(api.userDashboard.reportRecipeComment);
    const reportBlogComment = useMutation(api.userDashboard.reportBlogComment);
    const deleteOwnRecipeComment = useMutation(api.userDashboard.deleteOwnRecipeComment);
    const deleteOwnBlogComment = useMutation(api.userDashboard.deleteOwnBlogComment);
    const comments = target === "recipe" ? recipeComments : blogComments;

    async function handleSubmit() {
        const normalizedContent = content.trim();

        if (!normalizedContent) {
            return;
        }

        if (!isAuthenticated) {
            router.push("/(tabs)/profile" as never);
            return;
        }

        setIsSubmitting(true);

        try {
            if (target === "recipe") {
                await addRecipeComment({recipeId: contentId, content: normalizedContent});
            } else {
                await addBlogComment({blogId: contentId, content: normalizedContent});
            }
            setContent("");
        } catch (error) {
            toast({title: getErrorMessage(error), variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleCommentAction(commentId: string, isOwn: boolean) {
        if (!isAuthenticated) {
            router.push("/(tabs)/profile" as never);
            return;
        }

        if (isOwn) {
            Alert.alert(
                "Usunąć komentarz?",
                "Tej operacji nie można cofnąć.",
                [
                    {text: "Anuluj", style: "cancel"},
                    {
                        text: "Usuń",
                        style: "destructive",
                        onPress: () => {
                            void (async () => {
                                try {
                                    if (target === "recipe") {
                                        await deleteOwnRecipeComment({commentId: commentId as Id<"comments">});
                                    } else {
                                        await deleteOwnBlogComment({commentId: commentId as Id<"blogComments">});
                                    }
                                } catch (error) {
                                    toast({title: getErrorMessage(error), variant: "destructive"});
                                }
                            })();
                        },
                    },
                ],
            );
            return;
        }

        void (async () => {
            try {
                const reported = target === "recipe"
                    ? await reportRecipeComment({commentId: commentId as Id<"comments">})
                    : await reportBlogComment({commentId: commentId as Id<"blogComments">});

                toast({
                    title: reported ? "Komentarz został zgłoszony." : "Ten komentarz był już zgłoszony.",
                    variant: "success",
                });
            } catch (error) {
                toast({title: getErrorMessage(error), variant: "destructive"});
            }
        })();
    }

    return (
        <View className="mt-12 border-t border-white/10 pt-8">
            <View className="mb-5 flex-row items-center gap-2">
                <MessageCircle size={21} color="#a3e635" />
                <Text className="text-xl font-bold text-white">Komentarze</Text>
            </View>

            {comments === undefined ? (
                <View className="h-20 items-center justify-center">
                    <ActivityIndicator color="#a3e635" />
                </View>
            ) : comments.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-white/15 px-4 py-7">
                    <Text className="text-center text-sm leading-6 text-white/60">
                        Nie ma jeszcze komentarzy. Napisz pierwszy.
                    </Text>
                </View>
            ) : (
                <View className="gap-5">
                    {comments.map(comment => (
                        <View key={comment._id} className="flex-row gap-3">
                            <Avatar
                                size="sm"
                                src={comment.authorAvatarUrl ?? undefined}
                                fallback={comment.authorName.slice(0, 1).toUpperCase()}
                                className="bg-lime-400/15"
                            />
                            <View className="min-w-0 flex-1">
                                <View className="flex-row items-center gap-2">
                                    <Text className="flex-1 font-semibold text-white" numberOfLines={1}>
                                        {comment.authorName}
                                    </Text>
                                    <Text className="text-xs text-white/45">
                                        {formatCommentDate(comment.createdAt)}
                                    </Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={comment.isOwn ? "Usuń komentarz" : "Zgłoś komentarz"}
                                        hitSlop={10}
                                        onPress={() => handleCommentAction(comment._id, comment.isOwn)}
                                    >
                                        {comment.isOwn ? (
                                            <Trash2 size={16} color="rgba(255,255,255,0.55)" />
                                        ) : (
                                            <Flag size={16} color="rgba(255,255,255,0.55)" />
                                        )}
                                    </Pressable>
                                </View>
                                <Text className="mt-1 text-sm leading-6 text-white/80">
                                    {comment.content}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View className="mt-6 border-t border-white/10 pt-4">
                <TextInput
                    value={content}
                    onChangeText={setContent}
                    multiline
                    maxLength={1000}
                    editable={!isSubmitting}
                    placeholder={isLoading || isAuthenticated ? "Napisz komentarz..." : "Zaloguj się, aby dodać komentarz"}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="min-h-24 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white"
                    textAlignVertical="top"
                />
                <View className="mt-3 flex-row items-center justify-between gap-3">
                    <Text className="text-xs text-white/45">{content.length}/1000</Text>
                    <Pressable
                        accessibilityRole="button"
                        disabled={isSubmitting || !content.trim()}
                        onPress={() => void handleSubmit()}
                        className="flex-row items-center gap-2 rounded-full bg-lime-400 px-4 py-3 active:bg-lime-300 disabled:opacity-45"
                    >
                        {isSubmitting ? <ActivityIndicator color="#111827" /> : <Send size={17} color="#111827" />}
                        <Text className="font-semibold text-neutral-950">Dodaj</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}
