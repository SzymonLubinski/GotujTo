import {type ComponentProps, type ReactNode, useEffect, useState} from "react";
import {ActivityIndicator, Pressable, ScrollView, TextInput, View} from "react-native";
import {useRouter} from "expo-router";
import {Globe2, LockKeyhole, Mail, UserRound} from "lucide-react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {authClient} from "@/lib/auth-client";
import {Text} from "@/components/ui/text";

type AuthMode = "login" | "register";

type AuthFormProps = {
    mode: AuthMode;
};

function getErrorMessage(error: unknown) {
    if (typeof error === "object" && error !== null) {
        const details = error as {code?: unknown; message?: unknown; status?: unknown};

        if (details.status === 429) {
            return "Zbyt wiele prób. Spróbuj ponownie później.";
        }

        if (details.code === "EMAIL_NOT_VERIFIED") {
            return "Adres e-mail nie został jeszcze potwierdzony.";
        }

        if (typeof details.message === "string" && details.message.length > 0) {
            return details.message;
        }
    }

    return "Nie udało się wykonać tej operacji. Spróbuj ponownie.";
}

function hasErrorCode(error: unknown, code: string) {
    return typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === code;
}

export default function AuthForm({mode}: AuthFormProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {data: session, isPending: isSessionPending} = authClient.useSession();
    const isRegistering = mode === "register";
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [needsVerification, setNeedsVerification] = useState(false);

    useEffect(() => {
        if (!isSessionPending && session) {
            router.replace("/(tabs)/profile" as never);
        }
    }, [isSessionPending, router, session]);

    async function handleSubmit() {
        const normalizedEmail = email.trim();

        if (!normalizedEmail || !password || (isRegistering && !name.trim())) {
            setError("Uzupełnij wszystkie wymagane pola.");
            return;
        }

        setError(null);
        setNotice(null);
        setNeedsVerification(false);
        setIsPending(true);

        try {
            if (isRegistering) {
                const result = await authClient.signUp.email({
                    email: normalizedEmail,
                    name: name.trim(),
                    password,
                    callbackURL: "mobile://profile",
                });

                if (result.error) {
                    setError(getErrorMessage(result.error));
                    return;
                }

                setPassword("");
                setNotice("Wysłaliśmy link aktywacyjny. Potwierdź adres e-mail, aby zalogować się do GotujTo.");
                return;
            }

            const result = await authClient.signIn.email({
                email: normalizedEmail,
                password,
                rememberMe: true,
            });

            if (result.error) {
                setNeedsVerification(hasErrorCode(result.error, "EMAIL_NOT_VERIFIED"));
                setError(getErrorMessage(result.error));
                return;
            }

            router.replace("/(tabs)/profile" as never);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    async function handleResendVerification() {
        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            setError("Podaj adres e-mail użyty przy rejestracji.");
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            const result = await authClient.sendVerificationEmail({
                email: normalizedEmail,
                callbackURL: "mobile://profile",
            });

            if (result.error) {
                setError(getErrorMessage(result.error));
                return;
            }

            setNotice("Wysłaliśmy nowy link aktywacyjny na podany adres.");
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    async function handleGoogleSignIn() {
        setError(null);
        setNotice(null);
        setIsPending(true);

        try {
            const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: "mobile://profile",
            });

            if (result.error) {
                setError(getErrorMessage(result.error));
                return;
            }

            router.replace("/(tabs)/profile" as never);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <ScrollView
            className="flex-1 bg-black"
            contentContainerStyle={{paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 28)}}
            keyboardShouldPersistTaps="handled"
        >
            <View className="px-6">
                <View className="size-14 items-center justify-center rounded-2xl bg-lime-400/15">
                    <UserRound size={27} color="#a3e635" />
                </View>
                <Text className="mt-7 text-3xl font-bold text-white">
                    {isRegistering ? "Załóż konto" : "Zaloguj się"}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-white/60">
                    {isRegistering
                        ? "Zapisuj ulubione przepisy i korzystaj z GotujTo na swoich urządzeniach."
                        : "Wróć do swoich przepisów, lodówki i ustawień."}
                </Text>

                <View className="mt-8 gap-4">
                    {isRegistering && (
                        <AuthInput
                            icon={<UserRound size={19} color="rgba(255,255,255,0.55)" />}
                            label="Imię lub nazwa"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    )}
                    <AuthInput
                        icon={<Mail size={19} color="rgba(255,255,255,0.55)" />}
                        label="Adres e-mail"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                    />
                    <AuthInput
                        icon={<LockKeyhole size={19} color="rgba(255,255,255,0.55)" />}
                        label="Hasło"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete={isRegistering ? "new-password" : "current-password"}
                    />
                    {isRegistering && <Text className="-mt-2 text-xs text-white/45">Co najmniej 8 znaków.</Text>}
                </View>

                {error && <Message variant="error">{error}</Message>}
                {notice && <Message variant="notice">{notice}</Message>}

                <Pressable
                    accessibilityRole="button"
                    disabled={isPending}
                    onPress={() => void handleSubmit()}
                    className="mt-6 h-12 items-center justify-center rounded-full bg-lime-400 active:bg-lime-300 disabled:opacity-50"
                >
                    {isPending ? <ActivityIndicator color="#111827" /> : <Text className="font-bold text-neutral-950">{isRegistering ? "Utwórz konto" : "Zaloguj się"}</Text>}
                </Pressable>

                {!isRegistering && needsVerification && (
                    <Pressable
                        accessibilityRole="button"
                        disabled={isPending}
                        onPress={() => void handleResendVerification()}
                        className="mt-4 items-center py-2"
                    >
                        <Text className="font-semibold text-lime-300">Wyślij link aktywacyjny ponownie</Text>
                    </Pressable>
                )}

                {!isRegistering && (
                    <Pressable
                        accessibilityRole="button"
                        disabled={isPending}
                        onPress={() => router.push("/forgot-password" as never)}
                        className="mt-4 items-center py-2"
                    >
                        <Text className="font-semibold text-lime-300">Nie pamiętasz hasła?</Text>
                    </Pressable>
                )}

                <View className="my-7 flex-row items-center gap-3">
                    <View className="h-px flex-1 bg-white/10" />
                    <Text className="text-xs text-white/40">lub</Text>
                    <View className="h-px flex-1 bg-white/10" />
                </View>

                <Pressable
                    accessibilityRole="button"
                    disabled={isPending}
                    onPress={() => void handleGoogleSignIn()}
                    className="h-12 flex-row items-center justify-center gap-2 rounded-full border border-white/20 bg-white active:bg-zinc-200 disabled:opacity-50"
                >
                    <Globe2 size={19} color="#111827" />
                    <Text className="font-bold text-neutral-950">Kontynuuj przez Google</Text>
                </Pressable>

                <View className="mt-7 flex-row justify-center gap-1">
                    <Text className="text-sm text-white/60">{isRegistering ? "Masz już konto?" : "Nie masz jeszcze konta?"}</Text>
                    <Pressable onPress={() => router.replace(isRegistering ? "/login" as never : "/register" as never)}>
                        <Text className="text-sm font-semibold text-lime-300">{isRegistering ? "Zaloguj się" : "Załóż konto"}</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

function AuthInput({
    icon,
    label,
    ...inputProps
}: ComponentProps<typeof TextInput> & {icon: ReactNode; label: string}) {
    return (
        <View>
            <Text className="mb-2 text-sm font-medium text-white/80">{label}</Text>
            <View className="h-12 flex-row items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4">
                {icon}
                <TextInput
                    className="flex-1 text-base text-white"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    {...inputProps}
                />
            </View>
        </View>
    );
}

function Message({children, variant}: {children: string; variant: "error" | "notice"}) {
    return (
        <View className={`mt-5 rounded-xl border px-4 py-3 ${variant === "error" ? "border-red-400/30 bg-red-950/40" : "border-lime-400/30 bg-lime-400/10"}`}>
            <Text className={`text-sm leading-5 ${variant === "error" ? "text-red-100" : "text-lime-100"}`}>{children}</Text>
        </View>
    );
}
