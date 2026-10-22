import {type ReactNode} from "react";
import {Pressable, View} from "react-native";
import {ArrowLeft} from "lucide-react-native";

import {Text} from "@/components/ui/text";

type SubmissionFormLayoutProps = {
    icon: ReactNode;
    title: string;
    description: string;
    onCancel: () => void;
    children: ReactNode;
};

/** Shared visual frame for recipe and blog submission forms. */
export function SubmissionFormLayout({icon, title, description, onCancel, children}: SubmissionFormLayoutProps) {
    return <View className="gap-6 pb-8">
        <View className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <View className="flex-row items-start justify-between gap-4">
                <View className="size-12 items-center justify-center rounded-2xl bg-lime-400/15">{icon}</View>
                <Pressable accessibilityLabel="Wroc do listy zgloszen" onPress={onCancel} className="size-10 items-center justify-center rounded-full border border-white/15 bg-black/20 active:bg-white/10">
                    <ArrowLeft size={19} color="#ffffff" />
                </Pressable>
            </View>
            <Text className="mt-5 text-2xl font-bold text-white">{title}</Text>
            <Text className="mt-2 text-sm leading-6 text-white/60">{description}</Text>
        </View>
        <View className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <Text className="text-lg font-semibold text-white">Szczegoly</Text>
            <Text className="mt-1 text-sm leading-5 text-white/50">Wszystkie zgloszenia sa sprawdzane przed publikacja.</Text>
            <View className="mt-6 gap-5">{children}</View>
        </View>
    </View>;
}

export function SubmissionFormField({label, children}: {label: string; children: ReactNode}) {
    return <View><Text className="mb-2 text-sm font-medium text-white/80">{label}</Text>{children}</View>;
}
