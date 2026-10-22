import {Pressable, View} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {Film, Trash2} from "lucide-react-native";

import {Text} from "@/components/ui/text";
import {type SubmissionVideoAsset} from "@/lib/submissions/uploadVideo";

export function SubmissionVideoPicker({video, onChange}: {video?: SubmissionVideoAsset; onChange: (video?: SubmissionVideoAsset) => void}) {
    async function pickVideo() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["videos"],
            quality: 1,
        });
        const asset = result.assets?.[0];
        if (!asset) return;

        onChange({
            uri: asset.uri,
            mimeType: asset.mimeType ?? null,
            fileName: asset.fileName ?? null,
            fileSize: asset.fileSize ?? null,
        });
    }

    if (video) {
        return <View className="rounded-xl border border-white/15 bg-white/5 p-4"><View className="flex-row items-center gap-3"><View className="size-10 items-center justify-center rounded-full bg-lime-400/15"><Film size={19} color="#a3e635" /></View><View className="flex-1"><Text className="text-sm font-semibold text-white">{video.fileName ?? "Wybrany film"}</Text><Text className="mt-1 text-xs text-white/55">{video.mimeType ?? "Nieznany format"}</Text></View><Pressable accessibilityLabel="Usuń film" onPress={() => onChange(undefined)} className="size-9 items-center justify-center rounded-full active:bg-white/10"><Trash2 size={17} color="#fca5a5" /></Pressable></View></View>;
    }

    return <Pressable onPress={() => void pickVideo()} className="h-20 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 active:bg-white/10"><Film size={22} color="#a3e635" /><Text className="mt-2 text-sm font-medium text-lime-300">Dodaj film (opcjonalnie)</Text><Text className="mt-1 text-xs text-white/45">MP4 lub WebM · maks. 200 MB</Text></Pressable>;
}
