import {ActivityIndicator, Pressable, View} from "react-native";
import {LogIn, LogOut, UserPlus, UserRound} from "lucide-react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useRouter} from "expo-router";

import {Text} from "@/components/ui/text";
import {authClient} from "@/lib/auth-client";
import {ProfileDashboard} from "@/components/Profile/ProfileDashboard";

export default function ProfileScreen() {
    return <ProfileDashboard />;
}

// Retained temporarily as a fallback while the new profile dashboard is rolled out.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {data: session, isPending} = authClient.useSession();

    async function handleSignOut() {
        await authClient.signOut();
        router.replace("/" as never);
    }

    if (isPending) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator color="#a3e635" />
            </View>
        );
    }

    return (
        <View
            className="flex-1 items-center justify-center bg-black px-6"
            style={{paddingBottom: Math.max(insets.bottom, 16)}}
        >
            <View className="size-16 items-center justify-center rounded-full bg-lime-400/15">
                <UserRound size={30} color="#a3e635" />
            </View>
            <Text className="mt-5 text-2xl font-bold text-white">
                {session ? `Witaj, ${session.user.name}` : "Twój profil"}
            </Text>
            <Text className="mt-2 max-w-xs text-center text-sm leading-6 text-white/60">
                {session
                    ? session.user.email
                    : "Zaloguj się, aby zapisywać ulubione przepisy, lodówkę i własne treści."}
            </Text>

            {session ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={() => void handleSignOut()}
                    className="mt-8 flex-row items-center gap-2 rounded-full border border-white/15 px-5 py-3 active:bg-white/10"
                >
                    <LogOut size={18} color="#ffffff" />
                    <Text className="font-semibold text-white">Wyloguj się</Text>
                </Pressable>
            ) : (
                <View className="mt-8 w-full max-w-xs gap-3">
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push("/login" as never)}
                        className="flex-row items-center justify-center gap-2 rounded-full bg-lime-400 px-5 py-3 active:bg-lime-300"
                    >
                        <LogIn size={18} color="#111827" />
                        <Text className="font-semibold text-neutral-950">Zaloguj się</Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push("/register" as never)}
                        className="flex-row items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 active:bg-white/10"
                    >
                        <UserPlus size={18} color="#ffffff" />
                        <Text className="font-semibold text-white">Załóż konto</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
