"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {Pencil} from "lucide-react";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {Button} from "@/components/ui/button";

type AdminRecipeEditButtonProps = {
    recipeId: Id<"recipes">;
};

export function AdminRecipeEditButton({
                                          recipeId,
                                      }: AdminRecipeEditButtonProps) {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetch("/api/admin/status", {
            cache: "no-store",
        })
            .then(response => response.json())
            .then((result: {isAdmin: boolean}) => {
                setIsAdmin(result.isAdmin);
            })
            .catch(() => {
                setIsAdmin(false);
            });
    }, []);

    if (!isAdmin) {
        return null;
    }

    return (
        <Button
            asChild
            className="fixed right-4 top-4 z-50"
        >
            <Link
                href={`/admin/recipes/${recipeId}/edit`}
            >
                <Pencil className="size-4" />
                Edytuj
            </Link>
        </Button>
    );
}