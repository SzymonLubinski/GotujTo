import {PasswordResetRequestForm} from "@/components/web/PasswordResetRequestForm";

export const metadata = {
    title: "Reset hasła",
};

export default function ForgotPasswordPage() {
    return (
        <main className="flex min-h-dvh items-center justify-center bg-black px-5 py-12 text-white">
            <PasswordResetRequestForm />
        </main>
    );
}
