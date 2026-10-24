import {useState} from "react";
import {ActivityIndicator, Image, Pressable, View} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {useMutation} from "convex/react";
import {Camera, UserRound} from "lucide-react-native";
import {api} from "@gotujto/convex/_generated/api";
import {Text} from "@/components/ui/text";
import {useToast} from "@/components/ui/toast";
import {authClient} from "@/lib/auth-client";
import {uploadAvatar} from "@/lib/submissions/uploadAvatar";
import {type SubmissionImageAsset} from "@/lib/submissions/uploadImages";

export function ProfileAvatarForm({image}: {image?: string | null}) {
    const [selected, setSelected] = useState<SubmissionImageAsset | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const {toast} = useToast();
    const registerUpload = useMutation(api.userDashboard.registerPendingAvatarUpload);
    const syncPublicProfile = useMutation(api.userDashboard.syncPublicProfile);

    async function pickImage() {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                toast({title: "Zezwól aplikacji na dostęp do zdjęć.", variant: "destructive"});
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85});
            if (result.canceled) return;
            const asset = result.assets[0];
            setSelected({uri: asset.uri, mimeType: asset.mimeType ?? null, fileName: asset.fileName ?? null, fileSize: asset.fileSize ?? null});
        } catch {
            toast({title: "Nie udało się wybrać zdjęcia.", variant: "destructive"});
        }
    }

    async function saveImage() {
        if (!selected || isSaving) return;
        setIsSaving(true);
        try {
            const avatarUrl = await uploadAvatar(selected, registerUpload);
            const result = await authClient.updateUser({image: avatarUrl});
            if (result.error) throw new Error("Nie udało się zapisać zdjęcia profilu.");
            await syncPublicProfile();
            setSelected(null);
            toast({title: "Zdjęcie profilowe zostało zaktualizowane."});
        } catch (error) {
            toast({title: error instanceof Error ? error.message : "Nie udało się zmienić zdjęcia profilowego.", variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    }

    const preview = selected?.uri ?? image;
    return <View className="gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <Text className="text-lg font-semibold text-white">Zdjęcie profilowe</Text>
        <Text className="text-sm leading-5 text-white/60">Wybierz zdjęcie JPG, PNG lub WebP o rozmiarze do 5 MB.</Text>
        <View className="size-20 overflow-hidden rounded-full border border-lime-300/30 bg-lime-400/10">
            {preview ? <Image accessibilityLabel="Podgląd zdjęcia profilowego" source={{uri: preview}} className="size-full" /> : <View className="flex-1 items-center justify-center"><UserRound size={32} color="#a3e635" /></View>}
        </View>
        <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => void pickImage()} className="flex-row items-center justify-center gap-2 rounded-full border border-white/20 py-3 disabled:opacity-50">
            <Camera size={18} color="#d9f99d" /><Text className="font-semibold text-lime-200">Wybierz zdjęcie</Text>
        </Pressable>
        {selected && <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => void saveImage()} className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-lime-400 disabled:opacity-50">
            {isSaving && <ActivityIndicator color="#111827" />}<Text className="font-bold text-neutral-950">{isSaving ? "Zapisywanie..." : "Zapisz zdjęcie"}</Text>
        </Pressable>}
    </View>;
}
