import {paginationOptsValidator} from "convex/server";
import {query} from "./_generated/server";

export const getBlogContentPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },

    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("blog")
            .order("desc")
            .paginate(args.paginationOpts);

        const page = await Promise.all(
            result.page.map(async item => {
                const imageUrls = await Promise.all(
                    item.images.map(imageId =>
                        ctx.storage.getUrl(imageId),
                    ),
                );

                return {
                    ...item,
                    images: imageUrls.filter(
                        (url): url is string => url !== null,
                    ),
                };
            }),
        );

        return {
            ...result,
            page,
        };
    },
});