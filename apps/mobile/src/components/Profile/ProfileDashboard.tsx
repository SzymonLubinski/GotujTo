import {type ReactNode, useEffect, useState} from "react";
import {ActivityIndicator, Image, Pressable, ScrollView, TextInput, View} from "react-native";
import {useRouter} from "expo-router";
import {useConvexAuth, useMutation, useQuery} from "convex/react";
import {AlertTriangle, BookOpenText, ChefHat, Heart, LockKeyhole, LogIn, LogOut, Mail, Plus, Refrigerator, Settings2, Trash2, UserPlus, UserRound} from "lucide-react-native";

import {api} from "@gotujto/convex/_generated/api";
import {type Doc} from "@gotujto/convex/_generated/dataModel";
import {Text} from "@/components/ui/text";
import {authClient} from "@/lib/auth-client";
import {useToast} from "@/components/ui/toast";
import {RecipeSubmissionForm} from "@/components/Submission/RecipeSubmissionForm";
import {BlogSubmissionForm} from "@/components/Submission/BlogSubmissionForm";
import {ProfileAvatarForm} from "@/components/Profile/ProfileAvatarForm";

type ProfileTab = "settings" | "favorites" | "fridge" | "recipes" | "blog";
type Submission = Doc<"recipeSubmissions"> | Doc<"blogSubmissions">;

const tabs: {id: ProfileTab; label: string; icon: typeof Settings2}[] = [
    {id: "settings", label: "Ustawienia", icon: Settings2},
    {id: "favorites", label: "Ulubione", icon: Heart},
    {id: "fridge", label: "Lodówka", icon: Refrigerator},
    {id: "recipes", label: "Przepisy", icon: ChefHat},
    {id: "blog", label: "Posty", icon: BookOpenText},
];

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "object" && error !== null && "message" in error) {
        const {message} = error as {message?: unknown};
        if (typeof message === "string" && message) return message;
    }
    return fallback;
}

export function ProfileDashboard() {
    const router = useRouter();
    const {toast} = useToast();
    const {data: session, isPending: isSessionPending} = authClient.useSession();
    const {isAuthenticated, isLoading: isAuthLoading} = useConvexAuth();
    const [activeTab, setActiveTab] = useState<ProfileTab>("settings");
    const syncPublicProfile = useMutation(api.userDashboard.syncPublicProfile);
    const favoriteRecipes = useQuery(api.userDashboard.getFavoriteRecipes, isAuthenticated ? {} : "skip");
    const fridgeProducts = useQuery(api.userDashboard.getFridgeProducts, isAuthenticated ? {} : "skip");
    const recipeSubmissions = useQuery(api.userDashboard.getRecipeSubmissions, isAuthenticated ? {} : "skip");
    const blogSubmissions = useQuery(api.userDashboard.getBlogSubmissions, isAuthenticated ? {} : "skip");

    useEffect(() => {
        if (isAuthenticated) void syncPublicProfile().catch(() => undefined);
    }, [isAuthenticated, syncPublicProfile]);

    async function handleSignOut() {
        try {
            const result = await authClient.signOut();
            if (result.error) {
                toast({title: getErrorMessage(result.error, "Nie udało się wylogować."), variant: "destructive"});
                return;
            }
            router.replace("/" as never);
        } catch (error) {
            toast({title: getErrorMessage(error, "Nie udało się wylogować."), variant: "destructive"});
        }
    }

    if (isSessionPending || (session && isAuthLoading)) return <ProfileLoading />;
    if (!session || !isAuthenticated) return <SignedOutProfile />;

    let content: ReactNode;
    if (activeTab === "favorites") content = <FavoritesTab recipes={favoriteRecipes} />;
    else if (activeTab === "fridge") content = <FridgeTab products={fridgeProducts} />;
    else if (activeTab === "recipes") content = <SubmissionTabWithForm kind="recipe" submissions={recipeSubmissions} />;
    else if (activeTab === "blog") content = <SubmissionTabWithForm kind="blog" submissions={blogSubmissions} />;
    else content = <SettingsTab email={session.user.email} image={session.user.image} onSignOut={handleSignOut} />;

    return (
        <ScrollView className="flex-1 bg-black" contentContainerStyle={{paddingBottom: 120}} keyboardShouldPersistTaps="always">
            <View className="px-5 pt-10">
                <ProfileHeader name={session.user.name ?? ""} email={session.user.email} image={session.user.image} />
                <ScrollView className="-mx-5 mt-7 border-y border-white/10" horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2 px-5 py-3">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const selected = activeTab === tab.id;
                        return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{selected}} onPress={() => setActiveTab(tab.id)} className={selected ? "flex-row items-center gap-2 rounded-full bg-lime-400 px-4 py-2" : "flex-row items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"}>
                            <Icon size={16} color={selected ? "#111827" : "rgba(255,255,255,0.8)"} />
                            <Text className={selected ? "text-sm font-semibold text-neutral-950" : "text-sm font-medium text-white/80"}>{tab.label}</Text>
                        </Pressable>;
                    })}
                    </View>
                </ScrollView>
                <View className="pt-7">{content}</View>
            </View>
        </ScrollView>
    );
}

function ProfileLoading() {
    return <View className="flex-1 items-center justify-center bg-black"><ActivityIndicator color="#a3e635" /></View>;
}

function SignedOutProfile() {
    const router = useRouter();
    return <View className="flex-1 items-center justify-center bg-black px-6"><View className="size-16 items-center justify-center rounded-full bg-lime-400/15"><UserRound size={30} color="#a3e635" /></View><Text className="mt-5 text-2xl font-bold text-white">Twój profil</Text><Text className="mt-2 max-w-xs text-center text-sm leading-6 text-white/60">Zaloguj się, aby zapisywać ulubione przepisy, przechowywać lodówkę i publikować własne treści.</Text><View className="mt-8 w-full max-w-xs gap-3"><Pressable onPress={() => router.push("/login" as never)} className="flex-row items-center justify-center gap-2 rounded-full bg-lime-400 px-5 py-3 active:bg-lime-300"><LogIn size={18} color="#111827" /><Text className="font-semibold text-neutral-950">Zaloguj się</Text></Pressable><Pressable onPress={() => router.push("/register" as never)} className="flex-row items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 active:bg-white/10"><UserPlus size={18} color="#fff" /><Text className="font-semibold text-white">Załóż konto</Text></Pressable></View></View>;
}

function ProfileHeader({name, email, image}: {name: string; email: string; image?: string | null}) {
    return <View className="flex-row items-start gap-4"><View className="size-16 overflow-hidden rounded-full border border-lime-300/30 bg-lime-400/10">{image ? <Image accessibilityLabel="Twój avatar" className="size-full" source={{uri: image}} /> : <View className="flex-1 items-center justify-center"><UserRound size={30} color="#a3e635" /></View>}</View><View className="flex-1"><Text className="text-sm font-medium text-lime-300">Twój profil</Text><Text className="mt-1 text-2xl font-bold text-white">Witaj{name ? `, ${name}` : ""}</Text><Text className="mt-1 text-sm text-white/55">{email}</Text></View></View>;
}

function SettingsTab({email, image, onSignOut}: {email: string; image?: string | null; onSignOut: () => void}) {
    const router = useRouter();
    const {toast} = useToast();
    const requestEmailChange = useMutation(api.userDashboard.requestEmailChange);
    const prepareAccountDeletion = useMutation(api.userDashboard.prepareAccountDeletion);
    const [providerIds, setProviderIds] = useState<string[] | null>(null);
    const [newEmail, setNewEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [deleteApprovedRecipes, setDeleteApprovedRecipes] = useState(false);
    const [showDeletion, setShowDeletion] = useState(false);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        let isMounted = true;
        void authClient.listAccounts()
            .then(result => {
                if (isMounted) setProviderIds(result.data?.map(account => account.providerId) ?? []);
            })
            .catch(() => {
                if (isMounted) setProviderIds([]);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    const hasCredentialAccount = providerIds?.includes("credential") ?? false;

    async function handleEmailChange() {
        const value = newEmail.trim();
        if (!value) {
            toast({title: "Podaj nowy adres e-mail.", variant: "destructive"});
            return;
        }
        setIsPending(true);
        try {
            await requestEmailChange({newEmail: value, callbackURL: "mobile://profile"});
            setNewEmail("");
            toast({title: "Wyslalismy link potwierdzajacy na nowy adres e-mail."});
        } catch (error) {
            toast({title: getErrorMessage(error, "Nie udalo sie wyslac linku."), variant: "destructive"});
        } finally {
            setIsPending(false);
        }
    }

    async function handlePasswordChange() {
        if (!currentPassword || newPassword.length < 8) {
            toast({title: "Podaj obecne haslo i nowe haslo o dlugosci co najmniej 8 znakow.", variant: "destructive"});
            return;
        }
        setIsPending(true);
        try {
            const result = await authClient.changePassword({currentPassword, newPassword, revokeOtherSessions: true});
            if (result.error) {
                toast({title: getErrorMessage(result.error, "Nie udalo sie zmienic hasla."), variant: "destructive"});
                return;
            }
            setCurrentPassword("");
            setNewPassword("");
            toast({title: "Haslo zostalo zmienione. Pozostale sesje zostaly wylogowane."});
        } catch (error) {
            toast({title: getErrorMessage(error, "Nie udalo sie zmienic hasla."), variant: "destructive"});
        } finally {
            setIsPending(false);
        }
    }

    async function handleDeleteAccount() {
        if (confirmation.trim().toUpperCase() !== "USUN") {
            toast({title: 'Wpisz "USUN", aby potwierdzic usuniecie konta.', variant: "destructive"});
            return;
        }
        if (hasCredentialAccount && !deletePassword) {
            toast({title: "Podaj obecne haslo, aby usunac konto.", variant: "destructive"});
            return;
        }
        setIsPending(true);
        try {
            await prepareAccountDeletion({deleteApprovedRecipes});
            const result = await authClient.deleteUser({
                callbackURL: "mobile://",
                ...(hasCredentialAccount ? {password: deletePassword} : {}),
            });
            if (result.error) {
                toast({title: getErrorMessage(result.error, "Nie udalo sie usunac konta."), variant: "destructive"});
                return;
            }
            router.replace("/" as never);
        } catch (error) {
            toast({title: getErrorMessage(error, "Nie udalo sie usunac konta."), variant: "destructive"});
        } finally {
            setIsPending(false);
        }
    }

    if (providerIds === null) return <LoadingContent />;

    return <View className="gap-4">
        <ProfileCard icon={<UserRound size={21} color="#a3e635" />} title="Twoje konto" description={email} />
        <ProfileAvatarForm image={image} />
        {hasCredentialAccount ? <>
            <SettingsCard icon={<Mail size={20} color="#a3e635" />} title="Zmien adres e-mail" description="Potwierdzisz zmiane linkiem wyslanym na nowy adres.">
                <SettingsInput label="Nowy adres e-mail" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
                <PrimaryButton disabled={isPending} onPress={() => void handleEmailChange()}>Wyslij link</PrimaryButton>
            </SettingsCard>
            <SettingsCard icon={<LockKeyhole size={20} color="#a3e635" />} title="Zmien haslo" description="Zmiana wyloguje pozostale urzadzenia.">
                <SettingsInput label="Obecne haslo" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" />
                <SettingsInput label="Nowe haslo" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" />
                <Text className="-mt-2 text-xs text-white/45">Co najmniej 8 znakow.</Text>
                <PrimaryButton disabled={isPending} onPress={() => void handlePasswordChange()}>Zmien haslo</PrimaryButton>
            </SettingsCard>
        </> : <SettingsCard icon={<LockKeyhole size={20} color="#a3e635" />} title="Logowanie przez Google" description="Adres e-mail jest przypisany do konta Google i nie mozna go teraz zmienic w GotujTo.">
            <Text className="text-sm leading-5 text-white/70">Mozesz dodac haslo do konta GotujTo. Wyslemy link na ten adres e-mail.</Text>
            <PrimaryButton onPress={() => router.push("/forgot-password" as never)}>Nadaj haslo do konta GotujTo</PrimaryButton>
        </SettingsCard>}
        {!showDeletion ? <Pressable onPress={() => setShowDeletion(true)} className="mt-2 flex-row items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-950/20 py-3 active:bg-red-950/40"><Trash2 size={18} color="#fecaca" /><Text className="font-semibold text-red-100">Usuwanie konta</Text></Pressable> : <SettingsCard icon={<AlertTriangle size={20} color="#fca5a5" />} title="Usun konto" description="Tej operacji nie da sie cofnac. Lodowka, ulubione i niezaakceptowane zgloszenia zostana usuniete.">
            <Pressable onPress={() => setDeleteApprovedRecipes(value => !value)} className="flex-row items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 active:bg-white/5"><View className={deleteApprovedRecipes ? "mt-0.5 size-5 items-center justify-center rounded border border-red-300 bg-red-400" : "mt-0.5 size-5 rounded border border-red-300/60"}>{deleteApprovedRecipes && <Text className="text-xs font-bold text-black">✓</Text>}</View><Text className="flex-1 text-sm leading-5 text-white/80">Usun rowniez moje zaakceptowane przepisy. Bez zaznaczenia zostana zachowane i przypisane autorowi GotujTo.</Text></Pressable>
            {hasCredentialAccount && <SettingsInput label="Obecne haslo" value={deletePassword} onChangeText={setDeletePassword} secureTextEntry autoComplete="current-password" />}
            <SettingsInput label='Wpisz "USUN", aby potwierdzic' value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" />
            <Pressable disabled={isPending} onPress={() => void handleDeleteAccount()} className="h-12 items-center justify-center rounded-full bg-red-500 active:bg-red-400 disabled:opacity-50"><Text className="font-bold text-white">Usun konto na zawsze</Text></Pressable>
        </SettingsCard>}
        <Pressable onPress={() => void onSignOut()} className="mt-3 flex-row items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-950/20 py-3 active:bg-red-950/40"><LogOut size={18} color="#fecaca" /><Text className="font-semibold text-red-100">Wyloguj sie</Text></Pressable>
    </View>;
}

function SettingsCard({icon, title, description, children}: {icon: ReactNode; title: string; description: string; children: ReactNode}) {
    return <View className="gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"><View className="size-10 items-center justify-center rounded-full bg-lime-400/10">{icon}</View><View><Text className="text-lg font-semibold text-white">{title}</Text><Text className="mt-1 text-sm leading-5 text-white/60">{description}</Text></View>{children}</View>;
}

function SettingsInput({label, ...props}: {label: string} & React.ComponentProps<typeof TextInput>) {
    return <View><Text className="mb-2 text-sm font-medium text-white/85">{label}</Text><TextInput className="h-12 rounded-xl border border-white/15 bg-black/25 px-4 text-base text-white" placeholderTextColor="rgba(255,255,255,0.4)" {...props} /></View>;
}

function PrimaryButton({children, disabled, onPress}: {children: string; disabled?: boolean; onPress: () => void}) {
    return <Pressable disabled={disabled} onPress={onPress} className="h-12 items-center justify-center rounded-full bg-lime-400 active:bg-lime-300 disabled:opacity-50"><Text className="font-bold text-neutral-950">{children}</Text></Pressable>;
}

// Replaced by the interactive settings screen below; retained temporarily to
// avoid mixing unrelated profile-tab changes into this update.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacySettingsTab({email, onSignOut}: {email: string; onSignOut: () => void}) {
    return <View className="gap-4"><ProfileCard icon={<UserRound size={21} color="#a3e635" />} title="Twoje konto" description={email} /><ProfileCard icon={<Settings2 size={21} color="#a3e635" />} title="Ustawienia konta" description="Zmianę e-maila, hasła i avatara dodamy razem z pełną edycją profilu mobilnego." /><Pressable onPress={() => void onSignOut()} className="mt-3 flex-row items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-950/20 py-3 active:bg-red-950/40"><LogOut size={18} color="#fecaca" /><Text className="font-semibold text-red-100">Wyloguj się</Text></Pressable></View>;
}

function FavoritesTab({recipes}: {recipes: Doc<"recipes">[] | undefined}) {
    const router = useRouter();
    if (recipes === undefined) return <LoadingContent />;
    if (!recipes.length) return <EmptyContent icon={<Heart size={25} color="#a3e635" />} title="Brak ulubionych przepisów" description="Kliknij serce przy przepisie, aby zachować go na swoim profilu." />;
    return <View className="gap-3">{recipes.map(recipe => <Pressable key={recipe._id} onPress={() => router.push(`/recipe/${recipe._id}` as never)} className="rounded-2xl border border-white/10 bg-white/5 p-4 active:bg-white/10"><Text className="text-base font-semibold text-white">{recipe.name}</Text><Text className="mt-1 text-sm text-white/55">{recipe.cookingMinutes} min · {recipe.servings} porcji</Text></Pressable>)}</View>;
}

function FridgeTab({products}: {products: Doc<"products">[] | undefined}) {
    const router = useRouter();
    if (products === undefined) return <LoadingContent />;
    return <View><Text className="text-xl font-bold text-white">Twoja lodówka</Text><Text className="mt-2 text-sm leading-6 text-white/60">Produkty zapisane na koncie są automatycznie dostępne w zakładce Lodówka.</Text>{products.length ? <View className="mt-5 flex-row flex-wrap gap-2">{products.map(product => <View key={product._id} className="rounded-full bg-white/10 px-4 py-2"><Text className="text-sm text-white">{product.name}</Text></View>)}</View> : <View className="mt-5"><EmptyContent icon={<Refrigerator size={25} color="#a3e635" />} title="Lodówka jest pusta" description="Dodaj produkty, aby otrzymać pasujące przepisy." /></View>}<Pressable onPress={() => router.push("/fridge" as never)} className="mt-6 items-center rounded-full bg-lime-400 py-3 active:bg-lime-300"><Text className="font-semibold text-neutral-950">Otwórz lodówkę</Text></Pressable></View>;
}

function SubmissionsTab({kind, submissions}: {kind: "recipe" | "blog"; submissions: Submission[] | undefined}) {
    const router = useRouter();
    const isRecipe = kind === "recipe";
    if (submissions === undefined) return <LoadingContent />;
    if (!submissions.length) return <EmptyContent icon={isRecipe ? <ChefHat size={25} color="#a3e635" /> : <BookOpenText size={25} color="#a3e635" />} title={isRecipe ? "Nie wysłano jeszcze przepisów" : "Nie wysłano jeszcze postów"} description={isRecipe ? "Formularz dodania przepisu pojawi się w kolejnym etapie." : "Formularz dodania posta pojawi się w kolejnym etapie."} />;
    return <View className="gap-3">{submissions.map(submission => {
        const recipe = "name" in submission;
        const publishedId = recipe ? submission.reviewedRecipeId : submission.reviewedBlogId;
        const title = recipe ? submission.name : submission.title;
        const open = () => publishedId && router.push((recipe ? `/recipe/${publishedId}` : `/blog/${publishedId}`) as never);
        const statusClass = submission.status === "approved" ? "text-lime-300" : submission.status === "rejected" ? "text-red-300" : "text-amber-200";
        const status = submission.status === "approved" ? "Zatwierdzono" : submission.status === "rejected" ? "Odrzucono" : "Oczekuje";
        return <Pressable key={submission._id} disabled={!publishedId} onPress={open} className="rounded-2xl border border-white/10 bg-white/5 p-4 active:bg-white/10 disabled:opacity-75">
            <Text className="text-base font-semibold text-white">{title}</Text>
            <Text className={`mt-2 text-sm ${statusClass}`}>{status}{publishedId ? " · Otwórz" : ""}</Text>
            {submission.adminNote && <View className="mt-3 rounded-lg bg-white/5 px-3 py-2">
                <Text className="text-sm font-semibold text-white/80">Wiadomość od administratora</Text>
                <Text className="mt-1 text-sm leading-5 text-white/80">{submission.adminNote}</Text>
            </View>}
        </Pressable>;
    })}</View>;
}

function SubmissionTabWithForm({kind, submissions}: {kind: "recipe" | "blog"; submissions: Submission[] | undefined}) {
    const [isCreating, setIsCreating] = useState(false);
    const isRecipe = kind === "recipe";

    if (isCreating) {
        return isRecipe
            ? <RecipeSubmissionForm onComplete={() => setIsCreating(false)} />
            : <BlogSubmissionForm onComplete={() => setIsCreating(false)} onCancel={() => setIsCreating(false)} />;
    }

    if (submissions && submissions.length === 0) {
        return <View className="gap-5">
            <Pressable onPress={() => setIsCreating(true)} className="flex-row items-center justify-center gap-2 rounded-full bg-lime-400 py-3 active:bg-lime-300">
                <Plus size={18} color="#111827" />
                <Text className="font-semibold text-neutral-950">{isRecipe ? "Dodaj przepis" : "Dodaj post"}</Text>
            </Pressable>
            <EmptyContent icon={isRecipe ? <ChefHat size={25} color="#a3e635" /> : <BookOpenText size={25} color="#a3e635" />} title={isRecipe ? "Nie wysłano jeszcze przepisów" : "Nie wysłano jeszcze postów"} description="Po wysłaniu treść trafi do kolejki weryfikacji administratora." />
        </View>;
    }

    return <View className="gap-5">
        <Pressable onPress={() => setIsCreating(true)} className="flex-row items-center justify-center gap-2 rounded-full bg-lime-400 py-3 active:bg-lime-300">
            <Plus size={18} color="#111827" />
            <Text className="font-semibold text-neutral-950">{isRecipe ? "Dodaj przepis" : "Dodaj post"}</Text>
        </Pressable>
        <SubmissionsTab kind={kind} submissions={submissions} />
    </View>;
}

function ProfileCard({icon, title, description}: {icon: ReactNode; title: string; description: string}) {
    return <View className="rounded-2xl border border-white/10 bg-white/5 p-5"><View className="size-10 items-center justify-center rounded-full bg-lime-400/10">{icon}</View><Text className="mt-4 text-lg font-semibold text-white">{title}</Text><Text className="mt-2 text-sm leading-6 text-white/60">{description}</Text></View>;
}

function LoadingContent() {
    return <View className="min-h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><ActivityIndicator color="#a3e635" /></View>;
}

function EmptyContent({icon, title, description}: {icon: ReactNode; title: string; description: string}) {
    return <View className="items-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-10"><View>{icon}</View><Text className="mt-3 text-center text-lg font-semibold text-white">{title}</Text><Text className="mt-2 max-w-xs text-center text-sm leading-6 text-white/60">{description}</Text></View>;
}
