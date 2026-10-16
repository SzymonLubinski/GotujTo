import type {ReactNode} from "react";
import Link from "next/link";
import {Eye} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

export type SubmissionListItem = {
    id: string;
    title: string;
    authorName: string;
    meta: ReactNode;
    href?: string;
    unavailableMessage?: string;
};

type SubmissionListProps = {
    items: SubmissionListItem[];
    emptyMessage: string;
};

export function SubmissionList({items, emptyMessage}: SubmissionListProps) {
    if (items.length === 0) {
        return <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">{emptyMessage}</CardContent></Card>;
    }

    return <ul className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {items.map(item => <li key={item.id} className="flex flex-col gap-4 border-b p-5 last:border-b-0 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">Autor: {item.authorName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">{item.meta}</div>
            </div>

            {item.href ? <Button asChild variant="outline" className="shrink-0">
                <Link href={item.href}><Eye className="size-4" />Sprawdź</Link>
            </Button> : <span className="text-sm text-muted-foreground">{item.unavailableMessage}</span>}
        </li>)}
    </ul>;
}
