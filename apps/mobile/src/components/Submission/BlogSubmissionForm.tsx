import {type ReactNode, useState} from "react";
import {ActivityIndicator, Pressable, TextInput, View} from "react-native";
import {BookOpenText, Send} from "lucide-react-native";
import {useMutation} from "convex/react";

import {api} from "@gotujto/convex/_generated/api";
import {Text} from "@/components/ui/text";
import {SubmissionImagePicker} from "@/components/Submission/SubmissionImagePicker";
import {type SubmissionImageAsset, uploadSubmissionImages} from "@/lib/submissions/uploadImages";
import {type SubmissionVideoAsset, uploadSubmissionVideo} from "@/lib/submissions/uploadVideo";
import {SubmissionVideoPicker} from "@/components/Submission/SubmissionVideoPicker";
import {SubmissionFormLayout} from "@/components/Submission/SubmissionFormLayout";
import {useToast} from "@/components/ui/toast";

type BlogType = "tip" | "article" | "joke";

const blogTypes: {value: BlogType; label: string}[] = [
    {value: "article", label: "Artykuł"},
    {value: "tip", label: "Porada"},
    {value: "joke", label: "Ciekawostka"},
];

export function BlogSubmissionForm({onComplete, onCancel}: {onComplete: () => void; onCancel: () => void}) {
    const {toast} = useToast();
    const createSubmission = useMutation(api.userDashboard.createBlogSubmission);
    const generateUploadUrl = useMutation(api.userDashboard.generateBlogSubmissionImageUploadUrl);
    const registerUpload = useMutation(api.userDashboard.registerPendingSubmissionImage);
    const registerVideoUpload = useMutation(api.userDashboard.registerPendingSubmissionVideo);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<BlogType>("article");
    const [images, setImages] = useState<SubmissionImageAsset[]>([]);
    const [video, setVideo] = useState<SubmissionVideoAsset>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    async function handleSubmit() {
        if (!title.trim() || !description.trim()) {
            toast({title: "Uzupełnij tytuł i treść wpisu.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);
        try {
            let imageIds;
            imageIds = await uploadSubmissionImages(images, generateUploadUrl, registerUpload);
            let videoKey: string | undefined;
            if (video) {
                try {
                    videoKey = await uploadSubmissionVideo(video, "blog-submission", registerVideoUpload);
                } catch (error) {
                    throw new Error(error instanceof Error ? `Film nie zostal przeslany: ${error.message}` : "Film nie zostal przeslany.");
                }
            }
            await createSubmission({
                title: title.trim(),
                description: description.trim(),
                type,
                images: imageIds,
                videoKey,
            });
            toast({title: "Post został wysłany do weryfikacji.", variant: "success"});
            onComplete();
        } catch (error) {
            setSubmissionError(error instanceof Error ? error.message : "Nie udalo sie wyslac posta.");
            toast({title: error instanceof Error ? error.message : "Nie udało się wysłać posta.", variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <SubmissionFormLayout icon={<BookOpenText size={23} color="#a3e635" />} title="Dodaj post" description="Post trafi do weryfikacji przed publikacja." onCancel={onCancel}>
                <View className="mt-2 gap-5">
                    <FormField label="Tytuł"><TextInput value={title} onChangeText={setTitle} maxLength={160} className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white" placeholder="Np. Jak wykorzystać resztki warzyw" placeholderTextColor="rgba(255,255,255,0.4)" /></FormField>
                    <FormField label="Rodzaj wpisu"><View className="flex-row flex-wrap gap-2">{blogTypes.map(item => <Pressable key={item.value} onPress={() => setType(item.value)} className={type === item.value ? "rounded-full bg-lime-400 px-4 py-2" : "rounded-full border border-white/15 bg-white/5 px-4 py-2"}><Text className={type === item.value ? "text-sm font-semibold text-neutral-950" : "text-sm text-white/80"}>{item.label}</Text></Pressable>)}</View></FormField>
                    <FormField label="Treść"><TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" maxLength={20_000} className="min-h-48 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white" placeholder="Napisz, co chcesz przekazać czytelnikom…" placeholderTextColor="rgba(255,255,255,0.4)" /><Text className="mt-2 text-right text-xs text-white/40">{description.length}/20 000</Text></FormField>
                    <SubmissionImagePicker images={images} maxImages={4} onChange={setImages} />
                    <SubmissionVideoPicker video={video} onChange={setVideo} />
                    {submissionError && <View className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3"><Text className="text-sm leading-5 text-red-100">Nie wyslano posta: {submissionError}</Text></View>}
                    <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-lime-400 active:bg-lime-300 disabled:opacity-50">{isSubmitting ? <ActivityIndicator color="#111827" /> : <Send size={18} color="#111827" />}<Text className="font-bold text-neutral-950">Wyślij do weryfikacji</Text></Pressable>
                </View>
        </SubmissionFormLayout>
    );
}

function FormField({label, children}: {label: string; children: ReactNode}) {
    return <View><Text className="mb-2 text-sm font-medium text-white/80">{label}</Text>{children}</View>;
}

