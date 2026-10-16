"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {BadgePercent, BookOpenCheck, ChefHat, ClipboardCheck, CookingPot, Flag, LayoutDashboard, Menu, PackagePlus, ScrollText, type LucideIcon} from "lucide-react";

import {ModeToggle} from "@/components/web/dashboard/theme-toggle";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

type NavigationItem = {
    href: string;
    label: string;
    icon: LucideIcon;
};

type NavigationGroup = {
    label: string;
    items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
    {
        label: "Zarządzanie",
        items: [
            {href: "/admin", label: "Pulpit", icon: LayoutDashboard},
            {href: "/admin/recipes", label: "Przepisy", icon: CookingPot},
            {href: "/admin/recipe-imports", label: "Importy", icon: ScrollText},
        ],
    },
    {
        label: "Dodawanie",
        items: [
            {href: "/admin/add-recipe", label: "Nowy przepis", icon: ChefHat},
            {href: "/admin/add-product", label: "Nowy produkt", icon: PackagePlus},
            {href: "/admin/add-deals", label: "Promocje", icon: BadgePercent},
        ],
    },
    {
        label: "Moderacja",
        items: [
            {href: "/admin/recipe-submissions", label: "Przepisy klientów", icon: ClipboardCheck},
            {href: "/admin/blog-submissions", label: "Blog klientów", icon: BookOpenCheck},
            {href: "/admin/comment-reports", label: "Zgloszone komentarze", icon: Flag},
        ],
    },
];

function isActivePath(pathname: string, href: string) {
    return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}

export default function DashboardNavbar() {
    const pathname = usePathname();

    return <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
            <Link href="/admin" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
                <span className="flex size-8 items-center justify-center rounded-lg bg-lime-400 text-black"><ChefHat className="size-4" /></span>
                <span className="text-lg">Gotuj<span className="text-lime-500">To</span></span>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">Admin</span>
            </Link>

            <nav aria-label="Nawigacja administratora" className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
                {navigationGroups.flatMap(group => group.items).map(item => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item.href);

                    return <Link key={item.href} href={item.href} className={active ? "inline-flex items-center gap-2 rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-black" : "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"}><Icon className="size-4" />{item.label}</Link>;
                })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="sm" className="xl:hidden"><Menu className="size-4" />Menu</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        {navigationGroups.map((group, groupIndex) => <div key={group.label}>
                            {groupIndex > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                                {group.items.map(item => {
                                    const Icon = item.icon;
                                    const active = isActivePath(pathname, item.href);

                                    return <DropdownMenuItem key={item.href} asChild className={active ? "bg-lime-400/15 text-lime-700 dark:text-lime-300" : ""}><Link href={item.href}><Icon className="size-4" />{item.label}</Link></DropdownMenuItem>;
                                })}
                            </DropdownMenuGroup>
                        </div>)}
                    </DropdownMenuContent>
                </DropdownMenu>
                <ModeToggle />
            </div>
        </div>
    </header>;
}
