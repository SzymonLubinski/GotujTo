import {redirect} from "next/navigation";

import {AuthForm} from "@/components/web/AuthForm";
import {isAuthenticated} from "@/lib/auth-server";

export const metadata = {
    title: "Logowanie",
};

export default async function LoginPage() {
    if (await isAuthenticated()) {
        redirect("/profile");
    }

    return (
        <main className="flex min-h-dvh items-center justify-center bg-black px-5 py-12 text-white">
            <AuthForm mode="login" />
        </main>
    );
}
