import {Pressable, Image, View} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {ImagePlus, Trash2} from "lucide-react-native";

import {Text} from "@/components/ui/text";
import {type SubmissionImageAsset} from "@/lib/submissions/uploadImages";

type SubmissionImagePickerProps = {
    images: SubmissionImageAsset[];
    maxImages: number;
    onChange: (images: SubmissionImageAsset[]) => void;
};

export function SubmissionImagePicker({images, maxImages, onChange}: SubmissionImagePickerProps) {
    async function pickImages() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            selectionLimit: Math.max(1, maxImages - images.length),
            quality: 0.85,
        });

        if (result.canceled) {
            return;
        }

        const selected = result.assets.map(asset => ({
            uri: asset.uri,
            mimeType: asset.mimeType ?? null,
            fileName: asset.fileName ?? null,
            fileSize: asset.fileSize ?? null,
        }));
        onChange([...images, ...selected].slice(0, maxImages));
    }

    return (
        <View>
            <View className="flex-row items-center justify-between">
                <View>
                    <Text className="text-base font-semibold text-white">Zdjęcia</Text>
                    <Text className="mt-1 text-sm text-white/55">JPG, PNG lub WebP · maks. {maxImages}</Text>
                </View>
                <Text className="text-sm text-white/50">{images.length}/{maxImages}</Text>
            </View>

            {images.length > 0 && <View className="mt-4 flex-row flex-wrap gap-3">{images.map((image, index) => <View key={`${image.uri}-${index}`} className="relative size-20 overflow-hidden rounded-xl border border-white/15"><Image source={{uri: image.uri}} className="size-full" /><Pressable accessibilityLabel="Usuń zdjęcie" onPress={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-1 top-1 size-7 items-center justify-center rounded-full bg-black/70"><Trash2 size={14} color="#fff" /></Pressable></View>)}</View>}

            {images.length < maxImages && <Pressable onPress={() => void pickImages()} className="mt-4 h-24 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 active:bg-white/10"><ImagePlus size={22} color="#a3e635" /><Text className="mt-2 text-sm font-medium text-lime-300">Dodaj zdjęcia</Text></Pressable>}
        </View>
    );
}
