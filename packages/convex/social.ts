import {query} from "./_generated/server";

export const getSocialContent = query({
    args: {},

    handler: async ctx => {
        const socialItems = await ctx.db
            .query("social")
            .collect();

        return socialItems.filter(item => item.active);
    },
});