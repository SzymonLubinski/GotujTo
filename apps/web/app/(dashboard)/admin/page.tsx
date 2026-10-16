import Link from "next/link";
import {ArrowRight, BadgePercent, BookOpenCheck, ChefHat, ClipboardCheck, CookingPot, PackagePlus, ScrollText} from "lucide-react";

const primaryActions = [
    {href: "/admin/recipe-submissions", title: "Zgłoszenia przepisów", description: "Sprawdź przepisy przesłane przez klientów i zdecyduj o publikacji.", icon: ClipboardCheck, accent: "bg-lime-400 text-black"},
    {href: "/admin/blog-submissions", title: "Zgłoszenia blogowe", description: "Przejrzyj wpisy, zdjęcia i filmy przed pokazaniem ich na feedzie.", icon: BookOpenCheck, accent: "bg-sky-400 text-black"},
] as const;

const managementActions = [
    {href: "/admin/add-recipe", title: "Dodaj przepis", icon: ChefHat},
    {href: "/admin/recipes", title: "Edytuj przepisy", icon: CookingPot},
    {href: "/admin/add-product", title: "Dodaj produkt", icon: PackagePlus},
    {href: "/admin/add-deals", title: "Dodaj promocję", icon: BadgePercent},
    {href: "/admin/recipe-imports", title: "Obsłuż importy", icon: ScrollText},
] as const;

export default function AdminPage() {
    return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="max-w-2xl">
            <p className="text-sm font-semibold text-lime-600 dark:text-lime-300">Panel administratora</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dzień dobry, Szymon.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">Z tego miejsca dodasz treści, sprawdzisz zgłoszenia klientów i zaktualizujesz aktualne promocje.</p>
        </header>

        <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Do sprawdzenia</h2><p className="text-sm text-muted-foreground">Najpierw zweryfikuj treści od klientów.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
                {primaryActions.map(action => {
                    const Icon = action.icon;

                    return <Link key={action.href} href={action.href} className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-lime-400/60 hover:shadow-md">
                        <div className="flex items-start justify-between gap-4"><span className={`flex size-11 items-center justify-center rounded-xl ${action.accent}`}><Icon className="size-5" /></span><ArrowRight className="mt-2 size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" /></div>
                        <h3 className="mt-6 text-xl font-semibold">{action.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
                    </Link>;
                })}
            </div>
        </section>

        <section className="mt-10">
            <h2 className="text-lg font-semibold">Zarządzaj treścią</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {managementActions.map(action => {
                    const Icon = action.icon;

                    return <Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-lime-400/60 hover:bg-muted/50">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-lime-400/15 group-hover:text-lime-600 dark:group-hover:text-lime-300"><Icon className="size-5" /></span>
                        <span className="min-w-0 flex-1 font-medium">{action.title}</span>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>;
                })}
            </div>
        </section>
    </main>;
}
