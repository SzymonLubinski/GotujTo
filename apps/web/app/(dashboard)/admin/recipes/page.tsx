import Link from "next/link";
import {fetchQuery} from "convex/nextjs";
import {Search, Pencil} from "lucide-react";
import {api} from "@gotujto/convex/_generated/api";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";
import {Suspense} from "react";

type AdminRecipesPageProps = {
    searchParams: Promise<{
        q?: string | string[];
    }>;
};

export default function AdminRecipesPage(
    props: AdminRecipesPageProps,
) {
    return (
        <Suspense fallback={<RecipesLoading />}>
            <AdminRecipesContent {...props} />
        </Suspense>
    );
}

async function AdminRecipesContent({searchParams}: AdminRecipesPageProps) {
    await requireAdminRequest();

    const params = await searchParams;

    const rawQuery = Array.isArray(params.q)
        ? params.q[0]
        : params.q;

    const query = rawQuery?.trim() ?? "";

    const recipes =
        query.length >= 2
            ? await fetchQuery(
                api.recipes.searchRecipesForAdmin,
                {
                    adminSecret: getAdminSecret(),
                    phrase: query,
                    limit: 50,
                },
            )
            : [];

    // Wklej tutaj cały dotychczasowy return z formularzem i listą.
    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Przepisy
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Wyszukaj przepis, który chcesz edytować.
                </p>
            </div>

            <form method="GET" className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        name="q"
                        defaultValue={query}
                        minLength={2}
                        placeholder="Wpisz nazwę przepisu..."
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <Button type="submit">
                    Szukaj
                </Button>
            </form>

            <section className="mt-8">
                {query.length === 1 && (
                    <p className="text-sm text-muted-foreground">
                        Wpisz co najmniej 2 znaki.
                    </p>
                )}

                {query.length >= 2 && recipes.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Nie znaleziono przepisu.
                    </p>
                )}

                {recipes.length > 0 && (
                    <ul className="divide-y rounded-xl border">
                        {recipes.map(recipe => (
                            <li
                                key={recipe._id}
                                className="flex items-center gap-4 px-4 py-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {recipe.name}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {recipe.cookingMinutes} min · {recipe.servings} porcji
                                    </p>
                                </div>

                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/admin/recipes/${recipe._id}/edit`}>
                                        <Pencil className="size-4" />
                                        Edytuj
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}

function RecipesLoading() {
    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
            <div className="h-9 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-8 h-10 animate-pulse rounded bg-muted" />
            <p className="mt-6 text-sm text-muted-foreground">
                Ładowanie przepisów...
            </p>
        </main>
    );
}