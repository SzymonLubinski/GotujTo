import {useEffect, useState} from "react";
import {ActivityIndicator, Linking, Pressable, ScrollView, View} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useMutation, useQuery} from "convex/react";
import {FileCheck2} from "lucide-react-native";

import {api} from "@gotujto/convex/_generated/api";
import {Text} from "@/components/ui/text";
import {getPublicSiteUrl} from "@/lib/siteUrl";

function getNextPath(value: string | string[] | undefined) {
    const path = typeof value === "string" ? value : "/(tabs)/profile";

    return path.startsWith("/") && !path.startsWith("//") ? path : "/(tabs)/profile";
}

export default function TermsAcceptanceScreen() {
    const router = useRouter();
    const {next} = useLocalSearchParams<{next?: string | string[]}>();
    const nextPath = getNextPath(next);
    const hasAcceptedTerms = useQuery(api.legal.hasAcceptedTerms, {});
    const recordTermsAcceptance = useMutation(api.legal.recordTermsAcceptance);
    const [isChecked, setIsChecked] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const siteUrl = getPublicSiteUrl();

    useEffect(() => {
        if (hasAcceptedTerms) {
            router.replace(nextPath as never);
        }
    }, [hasAcceptedTerms, nextPath, router]);

    async function openLegalPage(path: "/regulamin" | "/polityka-prywatnosci") {
        if (!siteUrl) {
            setError("Brakuje adresu strony z dokumentami prawnymi.");
            return;
        }

        await Linking.openURL(`${siteUrl}${path}`);
    }

    async function handleContinue() {
        setError(null);

        if (!isChecked) {
            setError("Aby kontynuować, zaakceptuj Regulamin i Politykę prywatności.");
            return;
        }

        setIsPending(true);

        try {
            await recordTermsAcceptance({accepted: true});
            router.replace(nextPath as never);
        } catch {
            setError("Nie udało się zapisać akceptacji. Spróbuj ponownie.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <ScrollView className="flex-1 bg-black" contentContainerClassName="flex-grow justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
            <View className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
                <View className="size-14 items-center justify-center rounded-2xl bg-lime-400/15">
                    <FileCheck2 size={28} color="#a3e635" />
                </View>
                <Text className="mt-7 text-3xl font-bold text-white">Ostatni krok</Text>
                <Text className="mt-3 text-sm leading-6 text-white/60">Aby korzystać z funkcji GotujTo, potwierdź akceptację Regulaminu i Polityki prywatności.</Text>

                {hasAcceptedTerms === undefined ? (
                    <View className="mt-8 items-center"><ActivityIndicator color="#a3e635" /></View>
                ) : (
                    <>
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{checked: isChecked}}
                            onPress={() => {
                                setIsChecked(current => !current);
                                setError(null);
                            }}
                            className="mt-8 flex-row items-start gap-3"
                        >
                            <View className={`mt-0.5 size-5 items-center justify-center rounded border ${isChecked ? "border-lime-400 bg-lime-400" : "border-white/40"}`}>
                                {isChecked && <Text className="text-xs font-black text-black">✓</Text>}
                            </View>
                            <Text className="flex-1 text-sm leading-5 text-white/75">Akceptuję Regulamin oraz Politykę prywatności.</Text>
                        </Pressable>

                        <View className="mt-4 flex-row gap-4">
                            <Pressable onPress={() => void openLegalPage("/regulamin")}><Text className="text-sm font-semibold text-lime-300">Regulamin</Text></Pressable>
                            <Pressable onPress={() => void openLegalPage("/polityka-prywatnosci")}><Text className="text-sm font-semibold text-lime-300">Polityka prywatności</Text></Pressable>
                        </View>

                        {error && <View className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3"><Text className="text-sm leading-5 text-red-100">{error}</Text></View>}

                        <Pressable disabled={isPending} onPress={() => void handleContinue()} className="mt-7 h-12 items-center justify-center rounded-full bg-lime-400 active:bg-lime-300 disabled:opacity-50">
                            {isPending ? <ActivityIndicator color="#111827" /> : <Text className="font-bold text-neutral-950">Kontynuuj</Text>}
                        </Pressable>
                    </>
                )}
            </View>
        </ScrollView>
    );
}
