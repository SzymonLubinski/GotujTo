"use client";

import Link from "next/link";
import {useEffect, useMemo, useState, useTransition, type ChangeEvent, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useMutation, useQuery, useConvexAuth} from "convex/react";
import {
    ChefHat,
    Clock,
    FileText,
    Heart,
    ImagePlus,
    LoaderCircle,
    LockKeyhole,
    LogOut,
    Mail,
    Plus,
    Refrigerator,
    Search,
    Settings2,
    Trash2,
    UserRound,
    Users,
    X,
} from "lucide-react";

import {api} from "@gotujto/convex/_generated/api";
import type {Doc, Id} from "@gotujto/convex/_generated/dataModel";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {authClient} from "@/lib/auth-client";
import {uploadAvatar} from "@/lib/cloud/uploadAvatar";
import RecipeEditor from "@/components/web/recipe-form/RecipeEditor";
import {AccountDeletionForm} from "@/components/web/profile/AccountDeletionForm";
import {BlogSubmissionTab} from "@/components/web/profile/BlogSubmissionTab";
import {deleteRecipeSubmissionAction} from "@/app/actions";

type ProfileTab = "settings" | "favorites" | "fridge" | "submissions" | "blog";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const allowedAvatarTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const tabs: {id: ProfileTab; label: string; icon: typeof Settings2}[] = [
    {id: "settings", label: "Ustawienia", icon: Settings2},
    {id: "favorites", label: "Ulubione", icon: Heart},
    {id: "fridge", label: "Lodówka", icon: Refrigerator},
    {id: "submissions", label: "Dodaj przepis", icon: ChefHat},
    {id: "blog", label: "Dodaj post", icon: FileText},
];

function getErrorMessage(error: unknown) {
    return error instanceof Error && error.message
        ? error.message
        : "Nie udalo sie wykonac tej operacji. Sprobuj ponownie.";
}

export function ProfileDashboard() {
    const router = useRouter();
    const {data: session, error: sessionError, isPending} = authClient.useSession();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutError, setSignOutError] = useState<string | null>(null);

    useEffect(() => {
        if (!isSigningOut) return;

        let isMounted = true;

        void authClient.signOut({})
            .then(result => {
                if (!isMounted) return;

                if (result.error) {
                    setSignOutError(result.error.message ?? "Nie udalo sie wylogowac.");
                    setIsSigningOut(false);
                    return;
                }

                router.replace("/");
            })
            .catch(error => {
                if (!isMounted) return;
                setSignOutError(getErrorMessage(error));
                setIsSigningOut(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isSigningOut, router]);

    if (isSigningOut || isPending) return <ProfileLoading />;

    if (!session || sessionError) return <ProfileSignInRedirect />;

    return (
        <ProfileSessionContent
            email={session.user.email}
            name={session.user.name ?? ""}
            image={session.user.image ?? null}
            onSignOut={() => {
                setSignOutError(null);
                setIsSigningOut(true);
            }}
            signOutError={signOutError}
        />
    );
}

function ProfileSignInRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/login");
    }, [router]);

    return <ProfileLoading />;
}

function ProfileLoading() {
    return <main className="flex min-h-dvh items-center justify-center bg-black pb-24 text-white lg:bg-transparent"><LoaderCircle aria-label="Ladowanie profilu" className="size-6 animate-spin text-lime-300" /></main>;
}

function ProfileSessionContent({email, name, image, onSignOut, signOutError}: {email: string; name: string; image: string | null; onSignOut: () => void; signOutError: string | null}) {
    const {isAuthenticated, isLoading} = useConvexAuth();

    if (isLoading || !isAuthenticated) return <ProfileLoading />;

    return <AuthenticatedProfile email={email} name={name} image={image} onSignOut={onSignOut} signOutError={signOutError} />;
}

function AuthenticatedProfile({email, name, image, onSignOut, signOutError}: {email: string; name: string; image: string | null; onSignOut: () => void; signOutError: string | null}) {
    const [activeTab, setActiveTab] = useState<ProfileTab>("settings");
    const {hasCredentialAccount, isLoading: areAccountsLoading} = useAuthenticationMethods();
    const syncPublicProfile = useMutation(api.userDashboard.syncPublicProfile);

    useEffect(() => {
        void syncPublicProfile().catch(() => undefined);
    }, [syncPublicProfile]);

    return (
        <>
            <div aria-hidden className="feed-desktop-background" />
            <main className="relative z-10 h-full overflow-y-auto overscroll-contain bg-black pb-[calc(7rem+env(safe-area-inset-bottom))] pt-8 text-white lg:bg-transparent">
                <div className="mx-auto w-full max-w-md px-5">
                    <ProfileHeader name={name} image={image} />
                    <nav aria-label="Profil" className="-mx-5 mt-7 border-y border-white/10">
                        <div className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button type="button" key={tab.id} aria-current={isActive ? "page" : undefined} className={isActive ? "flex shrink-0 items-center gap-2 rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-black" : "flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"} onClick={() => setActiveTab(tab.id)}>
                                        <Icon className="size-4 shrink-0" />
                                        <span className="whitespace-nowrap">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="pt-7">
                        {activeTab === "settings" && <SettingsTab email={email} image={image} hasCredentialAccount={hasCredentialAccount} isLoadingAuthenticationMethods={areAccountsLoading} onSignOut={onSignOut} signOutError={signOutError} />}
                        {activeTab === "favorites" && <FavoritesTab />}
                        {activeTab === "fridge" && <FridgeTab />}
                        {activeTab === "submissions" && <RecipeSubmissionTab />}
                        {activeTab === "blog" && <BlogSubmissionTab />}
                    </div>
                </div>
            </main>
        </>
    );
}

function useAuthenticationMethods() {
    const [providerIds, setProviderIds] = useState<string[] | null>(null);

    useEffect(() => {
        let isMounted = true;

        void authClient.listAccounts()
            .then(result => {
                if (!isMounted) return;

                setProviderIds(result.data?.map(account => account.providerId) ?? []);
            })
            .catch(() => {
                if (!isMounted) return;

                // W razie problemu nie udostepniamy formularzy zmieniajacych dane logowania.
                setProviderIds([]);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        hasCredentialAccount: providerIds?.includes("credential") ?? false,
        isLoading: providerIds === null,
    };
}

function ProfileHeader({name, image}: {name: string; image: string | null}) {
    return (
        <header className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-lime-300/30 bg-lime-400/10 text-lime-300">
                {image ? <img src={image} alt="Twoj avatar" className="size-full object-cover" /> : <UserRound className="size-6" />}
            </div>
            <div>
                <p className="text-sm font-medium text-lime-300">Twoj profil</p>
                <h1 className="mt-1 text-3xl font-bold">Witaj{name ? <>, {name}</> : ""}</h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Zapisuj przepisy, przechowuj swoja lodowke i dziel sie pomyslami na dania.</p>
            </div>
        </header>
    );
}

function ProfileAvatarForm({image}: {image: string | null}) {
    const syncPublicProfile = useMutation(api.userDashboard.syncPublicProfile);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const displayedImage = previewUrl ?? image;

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        if (
            !allowedAvatarTypes.has(selectedFile.type)
            || selectedFile.size > MAX_AVATAR_SIZE
        ) {
            setError("Dodaj avatar JPG, PNG lub WebP o rozmiarze do 5 MB.");
            event.target.value = "";
            return;
        }

        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError(null);
        setNotice(null);
        event.target.value = "";
    }

    async function handleUpload() {
        if (!file) {
            return;
        }

        setIsUploading(true);
        setError(null);
        setNotice(null);

        try {
            const {avatarUrl} = await uploadAvatar(file);
            const result = await authClient.updateUser({image: avatarUrl});

            if (result.error) {
                setError(getErrorMessage(result.error));
                return;
            }

            setFile(null);
            setPreviewUrl(null);
            await syncPublicProfile();
            setNotice("Avatar zostal zaktualizowany.");
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <Card className="border border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-full bg-lime-400/15 text-lime-300"><ImagePlus className="size-5" /></div>
                <CardTitle>Avatar</CardTitle>
                <CardDescription className="text-zinc-400">Wybierz zdjecie, ktore bedzie widoczne przy Twoim profilu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/30 text-lime-300">
                        {displayedImage ? <img src={displayedImage} alt="Podglad avatara" className="size-full object-cover" /> : <UserRound className="size-7" />}
                    </div>
                    <div className="min-w-0 text-sm text-zinc-400">JPG, PNG lub WebP. Maksymalnie 5 MB.</div>
                </div>
                <Input id="profile-avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="border-white/15 bg-black/30 text-white file:text-white" />
                {file && <p className="truncate text-sm text-zinc-300">Wybrano: {file.name}</p>}
                {error && <Message kind="error">{error}</Message>}
                {notice && <Message kind="success">{notice}</Message>}
                <Button type="button" disabled={!file || isUploading} className="w-full bg-lime-400 text-black hover:bg-lime-300" onClick={() => void handleUpload()}>
                    {isUploading && <LoaderCircle className="size-4 animate-spin" />}
                    Zapisz avatar
                </Button>
            </CardContent>
        </Card>
    );
}

function SettingsTab({email, image, hasCredentialAccount, isLoadingAuthenticationMethods, onSignOut, signOutError}: {email: string; image: string | null; hasCredentialAccount: boolean; isLoadingAuthenticationMethods: boolean; onSignOut: () => void; signOutError: string | null}) {
    const requestEmailChange = useMutation(api.userDashboard.requestEmailChange);
    const [isPending, startTransition] = useTransition();
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAccountDeletion, setShowAccountDeletion] = useState(false);

    function handleEmailChange(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const newEmail = String(new FormData(form).get("newEmail") ?? "").trim();
        setNotice(null);
        setError(null);

        startTransition(() => {
            void requestEmailChange({newEmail})
                .then(() => {
                    form.reset();
                    setNotice("Wyslalismy link potwierdzajacy na nowy adres e-mail.");
                })
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        setNotice(null);
        setError(null);

        startTransition(() => {
            void authClient.changePassword({
                currentPassword: String(values.get("currentPassword") ?? ""),
                newPassword: String(values.get("newPassword") ?? ""),
                revokeOtherSessions: true,
            })
                .then(result => {
                    if (result.error) {
                        setError(getErrorMessage(result.error));
                        return;
                    }

                    form.reset();
                    setNotice("Hasło zostalo zmienione. Pozostale sesje zostaly wylogowane.");
                })
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    return (
        <section className="space-y-5">
            <ProfileAvatarForm image={image} />
            <Card className="border border-white/10 bg-zinc-950/90 text-white">
                <CardHeader>
                    <div className="flex size-11 items-center justify-center rounded-full bg-lime-400/15 text-lime-300"><UserRound className="size-5" /></div>
                    <CardTitle>Twoje konto</CardTitle>
                    <CardDescription className="text-zinc-400">{email}</CardDescription>
                </CardHeader>
            </Card>

            {isLoadingAuthenticationMethods ? <LoadingCard /> : hasCredentialAccount ? <>
                <Card className="border border-white/10 bg-zinc-950/90 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail className="size-4 text-lime-300" /> Zmien adres e-mail</CardTitle>
                        <CardDescription className="text-zinc-400">Potwierdzisz zmiane linkiem wyslanym na nowy adres.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-3" onSubmit={handleEmailChange}>
                            <Label htmlFor="newEmail">Nowy adres e-mail</Label>
                            <Input id="newEmail" name="newEmail" type="email" autoComplete="email" required className="border-white/15 bg-black/30 text-white" />
                            <Button type="submit" disabled={isPending} className="w-full bg-lime-400 text-black hover:bg-lime-300">{isPending && <LoaderCircle className="size-4 animate-spin" />}Wyslij link</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border border-white/10 bg-zinc-950/90 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LockKeyhole className="size-4 text-lime-300" /> Zmien haslo</CardTitle>
                        <CardDescription className="text-zinc-400">Zmiana wyloguje pozostale urzadzenia.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-3" onSubmit={handlePasswordChange}>
                            <div className="space-y-2"><Label htmlFor="currentPassword">Obecne haslo</Label><Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className="border-white/15 bg-black/30 text-white" /></div>
                            <div className="space-y-2"><Label htmlFor="newPassword">Nowe haslo</Label><Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required className="border-white/15 bg-black/30 text-white" /><p className="text-xs text-zinc-500">Co najmniej 8 znakow.</p></div>
                            <Button type="submit" disabled={isPending} className="w-full bg-lime-400 text-black hover:bg-lime-300">{isPending && <LoaderCircle className="size-4 animate-spin" />}Zmien haslo</Button>
                        </form>
                    </CardContent>
                </Card>
            </> : <Card className="border border-white/10 bg-zinc-950/90 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LockKeyhole className="size-4 text-lime-300" /> Logowanie przez konto zewnetrzne</CardTitle>
                    <CardDescription className="text-zinc-400">Adres e-mail jest przypisany do metody logowania i na ten moment nie mozna go zmienic w GotujTo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm leading-6 text-zinc-300">Mozesz dodac haslo do konta GotujTo. Wyslemy link na ten adres e-mail.</p>
                    <Button asChild className="w-full bg-lime-400 text-black hover:bg-lime-300">
                        <Link href="/forgot-password">Nadaj haslo do konta GotujTo</Link>
                    </Button>
                </CardContent>
            </Card>}

            {isLoadingAuthenticationMethods ? <Button type="button" disabled variant="outline" className="w-full border-white/10 bg-transparent text-zinc-400">
                <LoaderCircle className="size-4 animate-spin" />
                Sprawdzanie metod logowania
            </Button> : showAccountDeletion ? <AccountDeletionForm hasCredentialAccount={hasCredentialAccount} /> : <Button type="button" variant="outline" className="w-full border-red-400/30 bg-red-950/20 text-red-200 hover:bg-red-950/40 hover:text-red-100" onClick={() => setShowAccountDeletion(true)}>
                <Trash2 className="size-4" />
                Usuwanie konta
            </Button>}

            {error && <Message kind="error">{error}</Message>}
            {notice && <Message kind="success">{notice}</Message>}
            {signOutError && <Message kind="error">{signOutError}</Message>}
            <Button className="h-11 w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={onSignOut} variant="outline">
                <LogOut className="mr-2 size-4" />
                Wyloguj sie
            </Button>
        </section>
    );
}

function FavoritesTab() {
    const favorites = useQuery(api.userDashboard.getFavoriteRecipes);

    return (
        <section>
            <SectionHeading icon={Heart} title="Ulubione przepisy" description="Przepisy, do ktorych chcesz wrocic." />
            {favorites === undefined ? <LoadingCard /> : favorites.length === 0 ? (
                <EmptyState icon={Heart} title="Nie masz jeszcze ulubionych" description="Otworz przepis i kliknij serce, aby zapisac go na swoim koncie." action={{href: "/", label: "Przegladaj przepisy"}} />
            ) : (
                <div className="mt-5 space-y-3">
                    {favorites.map(recipe => <Link key={recipe._id} href={"/recipe/" + recipe._id} className="block rounded-2xl border border-white/10 bg-zinc-950/90 p-4 transition-colors hover:bg-zinc-900"><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-red-300"><Heart className="size-5 fill-current" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold text-white">{recipe.name}</h3><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400"><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{recipe.cookingMinutes} min</span><span className="inline-flex items-center gap-1"><Users className="size-3.5" />{recipe.servings} porcji</span></p></div></div></Link>)}
                </div>
            )}
        </section>
    );
}

function FridgeTab() {
    const router = useRouter();
    const fridgeProducts = useQuery(api.userDashboard.getFridgeProducts);
    const addFridgeProduct = useMutation(api.userDashboard.addFridgeProduct);
    const removeFridgeProduct = useMutation(api.userDashboard.removeFridgeProduct);
    const [phrase, setPhrase] = useState("");
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const suggestions = useQuery(api.products.searchProducts, phrase.trim().length >= 2 ? {phrase} : "skip");
    const productIds = useMemo(() => fridgeProducts?.map(product => product._id) ?? [], [fridgeProducts]);
    const filteredSuggestions = suggestions?.filter(product => !productIds.includes(product._id));

    function addProduct(product: Doc<"products">) {
        startTransition(() => {
            void addFridgeProduct({productId: product._id});
        });
        setPhrase("");
        setIsSuggestionsOpen(false);
    }

    function removeProduct(productId: Id<"products">) {
        startTransition(() => {
            void removeFridgeProduct({productId});
        });
    }

    function showRecipes() {
        const params = new URLSearchParams();
        productIds.forEach(productId => params.append("productId", productId));
        router.push("/fridge/results?" + params.toString());
    }

    return (
        <section>
            <SectionHeading icon={Refrigerator} title="Twoja lodowka" description="Produkty zapisane na Twoim koncie beda dostepne na kazdym urzadzeniu." />
            <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-5 -translate-y-1/2 text-white/40" />
                <Input value={phrase} onChange={event => {setPhrase(event.target.value); setIsSuggestionsOpen(true);}} onFocus={() => setIsSuggestionsOpen(true)} placeholder="Dodaj produkt do lodowki..." className="h-12 border-white/15 bg-zinc-950/90 pl-10 pr-10 text-white placeholder:text-zinc-500" />
                {phrase && <Button type="button" variant="ghost" size="icon" aria-label="Wyczysc wyszukiwanie" className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:bg-white/10 hover:text-white" onClick={() => setPhrase("")}><X className="size-4" /></Button>}
                {isSuggestionsOpen && phrase.trim().length >= 2 && <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">{suggestions === undefined && <p className="px-4 py-3 text-sm text-zinc-400">Wyszukiwanie...</p>}{filteredSuggestions?.length === 0 && <p className="px-4 py-3 text-sm text-zinc-400">Nie znaleziono produktu.</p>}{filteredSuggestions?.map(product => <button type="button" key={product._id} className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left text-white last:border-b-0 hover:bg-white/5" onMouseDown={event => event.preventDefault()} onClick={() => addProduct(product)}><span>{product.name}</span><Plus className="size-4 text-lime-300" /></button>)}</div>}
            </div>

            {fridgeProducts === undefined ? <div className="mt-5"><LoadingCard /></div> : fridgeProducts.length === 0 ? <div className="mt-5"><EmptyState icon={Refrigerator} title="Lodowka jest pusta" description="Dodaj produkty powyzej, a potem zobacz przepisy, ktore mozesz z nich przygotowac." /></div> : <><div className="mt-5 flex flex-wrap gap-2">{fridgeProducts.map(product => <div key={product._id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 pl-3 pr-1 text-sm text-white"><span>{product.name}</span><button type="button" aria-label={"Usun " + product.name + " z lodowki"} className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white" disabled={isPending} onClick={() => removeProduct(product._id)}><X className="size-3.5" /></button></div>)}</div><Button type="button" className="mt-7 h-12 w-full bg-lime-400 font-semibold text-black hover:bg-lime-300" onClick={showRecipes}><ChefHat className="size-4" />Pokaz pasujace przepisy</Button></>}
        </section>
    );
}

function RecipeSubmissionTab() {
    const submissions = useQuery(api.userDashboard.getRecipeSubmissions);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(true);
    const pendingSubmissions = submissions?.filter(submission => submission.status === "pending") ?? [];
    const reachedPendingSubmissionLimit = pendingSubmissions.length >= 10;

    function handleDelete(submissionId: Id<"recipeSubmissions">) {
        setError(null);
        startTransition(() => {
            void deleteRecipeSubmissionAction(submissionId)
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    return (
        <section className="space-y-7">
            {reachedPendingSubmissionLimit ? <Card className="border border-amber-300/30 bg-amber-300/10 text-white"><CardContent className="space-y-2 py-5"><p className="font-semibold text-amber-100">Masz juz 10 przepisow oczekujacych na weryfikacje.</p><p className="text-sm leading-6 text-amber-100/80">Poczekaj na decyzje administratora lub usun jedno z oczekujacych zgloszen, aby dodac nastepne.</p></CardContent></Card> : showForm ? <div>
                <SectionHeading icon={ChefHat} title="Dodaj przepis" description="Po wyslaniu przepis trafia do kolejki administratora. Nie bedzie widoczny publicznie przed zatwierdzeniem." />
                <p className="mt-3 text-sm leading-6 text-zinc-400">Dodaj zdjecia, pelne miary skladnikow oraz kolejne kroki. Film nie jest wymagany przy zgloszeniu.</p>
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 text-white">
                    <RecipeEditor mode="submission" embedded onSubmissionCreated={() => setShowForm(false)} />
                </div>
            </div> : <Card className="border border-lime-400/30 bg-lime-400/10 text-white"><CardContent className="space-y-4 py-5"><p className="font-semibold text-lime-100">Przepis zostal wyslany do weryfikacji.</p><Button type="button" className="bg-lime-400 text-black hover:bg-lime-300" onClick={() => setShowForm(true)}><Plus className="size-4" />Dodaj kolejny przepis</Button></CardContent></Card>}

            {error && <Message kind="error">{error}</Message>}
            <section>
                <h3 className="text-lg font-semibold">Twoje zgloszenia</h3>
                {submissions === undefined ? <div className="mt-4"><LoadingCard /></div> : submissions.length === 0 ? <p className="mt-3 text-sm text-zinc-400">Nie wyslales jeszcze zadnego przepisu.</p> : <div className="mt-4 space-y-3">{submissions.map(submission => {
                    const publishedRecipeId = submission.status === "approved" ? submission.reviewedRecipeId : undefined;
                    const card = <article className={publishedRecipeId ? "rounded-2xl border border-lime-300/30 bg-zinc-950/90 p-4 transition-colors hover:border-lime-300/60 hover:bg-zinc-900" : "rounded-2xl border border-white/10 bg-zinc-950/90 p-4"}><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-white">{submission.name}</h4><p className="mt-1 text-sm text-zinc-400">{submission.cookingMinutes} min · {submission.servings} porcji</p></div><SubmissionStatus status={submission.status} /></div>{submission.adminNote && <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-300">{submission.adminNote}</p>}{publishedRecipeId && <p className="mt-3 text-sm font-medium text-lime-300">Zobacz opublikowany przepis →</p>}{submission.status === "pending" && <Button type="button" variant="ghost" size="sm" disabled={isPending} className="mt-3 text-red-300 hover:bg-red-400/10 hover:text-red-200" onClick={() => handleDelete(submission._id)}><Trash2 className="size-3.5" />Usun zgloszenie</Button>}</article>;

                    return publishedRecipeId ? <Link key={submission._id} href={`/recipe/${publishedRecipeId}`} className="block">{card}</Link> : <div key={submission._id}>{card}</div>;
                })}</div>}
            </section>
        </section>
    );
}

function SectionHeading({icon: Icon, title, description}: {icon: typeof Settings2; title: string; description: string}) {
    return <div><div className="flex items-center gap-2 text-lime-300"><Icon className="size-4" /><span className="text-sm font-medium">Profil</span></div><h2 className="mt-2 text-2xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p></div>;
}

function EmptyState({icon: Icon, title, description, action}: {icon: typeof Heart; title: string; description: string; action?: {href: string; label: string}}) {
    return <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/70 px-5 py-10 text-center"><Icon className="mx-auto size-6 text-lime-300" /><h3 className="mt-3 font-semibold text-white">{title}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-400">{description}</p>{action && <Button asChild className="mt-5 bg-lime-400 text-black hover:bg-lime-300"><Link href={action.href}>{action.label}</Link></Button>}</div>;
}

function LoadingCard() {
    return <div className="flex min-h-28 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/90"><LoaderCircle className="size-5 animate-spin text-lime-300" /></div>;
}

function Message({children, kind}: {children: string; kind: "error" | "success"}) {
    return <p role={kind === "error" ? "alert" : "status"} className={kind === "error" ? "mt-6 rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200" : "mt-6 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-100"}>{children}</p>;
}

function SubmissionStatus({status}: {status: "pending" | "approved" | "rejected"}) {
    const labels = {pending: "Oczekuje", approved: "Zatwierdzono", rejected: "Odrzucono"};
    const styles = {pending: "border-amber-300/30 bg-amber-300/10 text-amber-200", approved: "border-lime-300/30 bg-lime-300/10 text-lime-200", rejected: "border-red-300/30 bg-red-300/10 text-red-200"};

    return <span className={"shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium " + styles[status]}>{labels[status]}</span>;
}
