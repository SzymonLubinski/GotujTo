import Link from "next/link";
import {Clock, UserRound} from "lucide-react";
import {type ShortItemData} from "@gotujto/shared/types/result-type";
import {type Id} from "@gotujto/convex/_generated/dataModel";

type ShortItemFooterProps = {
    item: ShortItemData;
    dealProductIds: Id<"products">[];
    fridgeProductIds: Id<"products">[];
};

export default function ShortItemFooter({item, dealProductIds, fridgeProductIds,}: ShortItemFooterProps) {
    const query = {
        ...(dealProductIds?.length
            ? {dealProductIds}
            : {}),
        ...(fridgeProductIds?.length
            ? {fridgeProductIds}
            : {}),
    };
    return (
        <>
            <Link
                className="pointer-events-auto inline-block"
                href={{
                    pathname: `/recipe/${item.recipe._id}`,
                    query,
                }}
            >
                <h2 className="text-3xl font-bold tracking-tight">
                    {item.recipe.name}
                </h2>
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                <div className="flex items-center gap-2">
                    <Clock className="size-4" />
                    <span>
                        {item.recipe.cookingMinutes} min
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <UserRound className="size-4" />
                    <span>{item.recipe.authorId}</span>
                </div>
            </div>
        </>
    );
}