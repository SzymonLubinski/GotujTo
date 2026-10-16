"use client";

import {useState} from "react";
import {BookOpenText, ChefHat, UserRound} from "lucide-react";

import {
    PublicProfileFeed,
    type PublicProfileBlogPost,
    type PublicProfileRecipe,
} from "@/components/web/profile/PublicProfileFeed";

type PublicProfileTab = "recipes" | "blog";

type PublicProfile = {
    userId: string;
    name: string;
    image?: string;
};

type PublicProfileContentProps = {
    profile: PublicProfile;
    recipes: PublicProfileRecipe[];
    blogPosts: PublicProfileBlogPost[];
};

export function PublicProfileContent({profile, recipes, blogPosts}: PublicProfileContentProps) {
    const [activeTab, setActiveTab] = useState<PublicProfileTab>("recipes");

    return (
        <>
            <header className="flex items-center gap-5 border-b border-white/10 pb-8 pt-14">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-lime-300/30 bg-lime-400/10 text-lime-300">
                    {profile.image ? <img src={profile.image} alt={`Avatar autora ${profile.name}`} className="size-full object-cover" /> : <UserRound className="size-9" />}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-lime-300">Profil autora</p>
                    <h1 className="mt-1 break-words text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
                    <p className="mt-2 text-sm text-white/60">Przepisy i wpisy opublikowane w GotujTo.</p>
                </div>
            </header>

            <nav aria-label="Tresci autora" className="mt-7 grid grid-cols-2 border-b border-white/10">
                <button
                    type="button"
                    onClick={() => setActiveTab("recipes")}
                    aria-current={activeTab === "recipes" ? "page" : undefined}
                    className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${activeTab === "recipes" ? "border-lime-300 text-lime-300" : "border-transparent text-white/55 hover:text-white"}`}
                >
                    <ChefHat className="size-4" />
                    Przepisy ({recipes.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("blog")}
                    aria-current={activeTab === "blog" ? "page" : undefined}
                    className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${activeTab === "blog" ? "border-lime-300 text-lime-300" : "border-transparent text-white/55 hover:text-white"}`}
                >
                    <BookOpenText className="size-4" />
                    Blog ({blogPosts.length})
                </button>
            </nav>

            <section className="mt-8" aria-labelledby={activeTab === "recipes" ? "public-profile-recipes-heading" : "public-profile-blog-heading"}>
                <h2 id={activeTab === "recipes" ? "public-profile-recipes-heading" : "public-profile-blog-heading"} className="sr-only">
                    {activeTab === "recipes" ? "Przepisy autora" : "Wpisy autora"}
                </h2>
                {activeTab === "recipes" ? (
                    <PublicProfileFeed key="recipes" type="recipes" items={recipes} />
                ) : (
                    <PublicProfileFeed key="blog" type="blog" items={blogPosts} />
                )}
            </section>
        </>
    );
}
