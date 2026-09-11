'use client'

import {ModeToggle} from "@/components/web/dashboard/theme-toggle";
import {Button, buttonVariants} from "@/components/ui/button";
import Link from "next/link";
import {DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import {Broccoli, CookingPot, Layers, BadgePercent} from "lucide-react";


export default function DashboardNavbar() {
    return (
        <nav className="my-2 mx-2">
            <div className="flex justify-between my-2">
                <Link href="/" className="">
                    <h1 className="text-3xl font-bold">
                        Gotuj<span className="text-blue-500">To</span>
                    </h1>
                </Link>
                <div className="">
                    <div className="hidden md:block mr-2">
                    </div>
                    <ModeToggle/>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Menu
                        <Layers className="ml-auto group-data-[state=open]:rotate-180"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-50" align="start">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Formularze</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <Link className={buttonVariants({variant: "ghost"})} href="/admin/add-product">
                                Dodaj produkt
                            </Link>
                            <DropdownMenuShortcut>
                                <Broccoli/>
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link className={buttonVariants({variant: "ghost"})} href="/admin/add-recipe">
                                Dodaj przepis
                            </Link>
                            <DropdownMenuShortcut>
                                <CookingPot/>
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link className={buttonVariants({variant: "ghost"})} href="/admin/add-deals">
                                Dodaj deals
                            </Link>
                            <DropdownMenuShortcut>
                                <BadgePercent />
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link className={buttonVariants({variant: "ghost"})} href="/admin/recipe-imports">
                                Obsługa importów
                            </Link>
                            <DropdownMenuShortcut>
                                <CookingPot/>
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
    )
}