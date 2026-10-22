import {type ComponentProps, type ReactNode, useState} from "react";
import {ActivityIndicator, Pressable, ScrollView, TextInput, View} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {LockKeyhole, Mail} from "lucide-react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {authClient} from "@/lib/auth-client";
import {Text} from "@/components/ui/text";

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error !== null) {
        const details = error as {message?: unknown; status?: unknown};

        if (details.status === 429) {
            return "Zbyt wiele prób. Spróbuj ponownie później.";
        }

        if (typeof details.message === "string" && details.message.length > 0) {
            return details.message;
        }
    }

    return fallback;
}

function AuthScreen({children}: {children: ReactNode}) {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            className="flex-1 bg-black"
            contentContainerStyle={{paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 28)}}
            keyboardShouldPersistTaps="handled"
        >
            <View className="px-6">{children}</View>
        </ScrollView>
    );
}

function Input({
    icon,
    label,
    ...props
}: ComponentProps<typeof TextInput> & {icon: ReactNode; label: string}) {
    return (
        <View>
            <Text className="mb-2 text-sm font-medium text-white/80">{label}</Text>
            <View className="h-12 flex-row items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4">
                {icon}
                <TextInput
                    className="flex-1 text-base text-white"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    {...props}
                />
            </View>
        </View>
    );
}

function Message({children, error = false}: {children: string; error?: boolean}) {
    return (
        <View className={`mt-5 rounded-xl border px-4 py-3 ${error ? "border-red-400/30 bg-red-950/40" : "border-lime-400/30 bg-lime-400/10"}`}>
            <Text className={`text-sm leading-5 ${error ? "text-red-100" : "text-lime-100"}`}>{children}</Text>
        </View>
    );
}

export function ForgotPasswordForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    async function handleSubmit() {
        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            setError("Podaj adres e-mail użyty przy rejestracji.");
            return;
        }

        setError(null);
        setNotice(null);
        setIsPending(true);

        try {
            const result = await authClient.requestPasswordReset({
                email: normalizedEmail,
                redirectTo: "mobile://reset-password",
            });

            if (result.error) {
                setError(getErrorMessage(result.error, "Nie udało się wysłać linku."));
                return;
            }

            setNotice("Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła.");
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Nie udało się wysłać linku."));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <AuthScreen>
            <View className="size-14 items-center justify-center rounded-2xl bg-lime-400/15">
                <Mail size={27} color="#a3e635" />
            </View>
            <Text className="mt-7 text-3xl font-bold text-white">Nie pamiętasz hasła?</Text>
            <Text className="mt-2 text-sm leading-6 text-white/60">Podaj adres e-mail użyty przy rejestracji. Wyślemy link do ustawienia nowego hasła.</Text>

            <View className="mt-8">
                <Input
                    autoCapitalize="none"
                    autoComplete="email"
                    icon={<Mail size={19} color="rgba(255,255,255,0.55)" />}
                    keyboardType="email-address"
                    label="Adres e-mail"
                    onChangeText={setEmail}
                    value={email}
                />
            </View>

            {error && <Message error>{error}</Message>}
            {notice && <Message>{notice}</Message>}

            <Pressable
                accessibilityRole="button"
                disabled={isPending}
                onPress={() => void handleSubmit()}
                className="mt-6 h-12 items-center justify-center rounded-full bg-lime-400 active:bg-lime-300 disabled:opacity-50"
            >
                {isPending ? <ActivityIndicator color="#111827" /> : <Text className="font-bold text-neutral-950">Wyślij link</Text>}
            </Pressable>
            <Pressable onPress={() => router.replace("/login" as never)} className="mt-6 items-center py-2">
                <Text className="font-semibold text-lime-300">Wróć do logowania</Text>
            </Pressable>
        </AuthScreen>
    );
}

export function ResetPasswordForm() {
    const router = useRouter();
    const {token, error: tokenError} = useLocalSearchParams<{token?: string; error?: string}>();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(tokenError || (!token ? "Link do resetu hasła jest nieprawidłowy albo wygasł." : null));
    const [notice, setNotice] = useState<string | null>(null);

    async function handleSubmit() {
        if (!token) {
            setError("Link do resetu hasła jest nieprawidłowy albo wygasł.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Hasło musi mieć co najmniej 8 znaków.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Wpisane hasła nie są takie same.");
            return;
        }

        setError(null);
        setNotice(null);
        setIsPending(true);

        try {
            const result = await authClient.resetPassword({newPassword, token});

            if (result.error) {
                setError(getErrorMessage(result.error, "Nie udało się ustawić nowego hasła."));
                return;
            }

            setNotice("Hasło zostało zmienione. Możesz się teraz zalogować.");
            setTimeout(() => router.replace("/login" as never), 1_500);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Nie udało się ustawić nowego hasła."));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <AuthScreen>
            <View className="size-14 items-center justify-center rounded-2xl bg-lime-400/15">
                <LockKeyhole size={27} color="#a3e635" />
            </View>
            <Text className="mt-7 text-3xl font-bold text-white">Ustaw nowe hasło</Text>
            <Text className="mt-2 text-sm leading-6 text-white/60">Nowe hasło musi mieć co najmniej 8 znaków.</Text>

            <View className="mt-8 gap-4">
                <Input
                    autoComplete="new-password"
                    icon={<LockKeyhole size={19} color="rgba(255,255,255,0.55)" />}
                    label="Nowe hasło"
                    onChangeText={setNewPassword}
                    secureTextEntry
                    value={newPassword}
                />
                <Input
                    autoComplete="new-password"
                    icon={<LockKeyhole size={19} color="rgba(255,255,255,0.55)" />}
                    label="Powtórz nowe hasło"
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    value={confirmPassword}
                />
            </View>

            {error && <Message error>{error}</Message>}
            {notice && <Message>{notice}</Message>}

            {!notice && (
                <Pressable
                    accessibilityRole="button"
                    disabled={isPending || !token}
                    onPress={() => void handleSubmit()}
                    className="mt-6 h-12 items-center justify-center rounded-full bg-lime-400 active:bg-lime-300 disabled:opacity-50"
                >
                    {isPending ? <ActivityIndicator color="#111827" /> : <Text className="font-bold text-neutral-950">Zmień hasło</Text>}
                </Pressable>
            )}

            <Pressable onPress={() => router.replace("/forgot-password" as never)} className="mt-6 items-center py-2">
                <Text className="font-semibold text-lime-300">Wyślij nowy link</Text>
            </Pressable>
        </AuthScreen>
    );
}
