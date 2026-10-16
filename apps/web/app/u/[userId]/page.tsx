import {notFound} from "next/navigation";
import {fetchQuery} from "convex/nextjs";

import {api} from "@gotujto/convex/_generated/api";
import {PublicProfileBackButton} from "@/components/web/profile/PublicProfileBackButton";
import {PublicProfileContent} from "@/components/web/profile/PublicProfileContent";

type PublicProfilePageProps = {
    params: Promise<{
        userId: string;
    }>;
};

export default async function PublicProfilePage({params}: PublicProfilePageProps) {
    const {userId} = await params;
    const profile = await fetchQuery(api.userDashboard.getPublicProfile, {userId});

    if (!profile) {
        notFound();
    }

    return (
        <main className="relative min-h-dvh bg-black pb-16 pt-4 text-white sm:pt-6">
            <PublicProfileBackButton />
            <div className="mx-auto w-full max-w-md px-5 sm:px-0">
                <PublicProfileContent
                    profile={profile.profile}
                    recipes={profile.recipes}
                    blogPosts={profile.blogPosts}
                />
            </div>
        </main>
    );
}
