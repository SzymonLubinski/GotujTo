import Link from "next/link";

const LINKS = {
    email: "mailto:kontakt@twoja-strona.pl",
    instagram:
        "https://www.instagram.com/twoje-konto",
    facebook:
        "https://www.facebook.com/twoje-konto",
};

export default function MorePage() {
    const appVersion =
        process.env.NEXT_PUBLIC_APP_VERSION ??
        "1.0.0";

    return (
        <main className="h-dvh overflow-y-auto bg-black px-5 pb-32 pt-12 text-white">
            <div className="mx-auto w-full max-w-3xl">
                <h1 className="text-4xl font-bold">
                    Więcej
                </h1>

                <p className="mt-3 text-neutral-400">
                    Informacje o GotujTo, kontakt oraz
                    ustawienia aplikacji.
                </p>

                <SectionTitle>
                    O GotujTo
                </SectionTitle>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500/15 text-xl text-orange-400">
                        i
                    </div>

                    <h2 className="mt-4 text-2xl font-bold">
                        GotujTo
                    </h2>

                    <p className="mt-3 leading-7 text-neutral-400">
                        GotujTo pomaga odkrywać przepisy,
                        wykorzystywać produkty znajdujące
                        się w lodówce oraz znajdować
                        kulinarne inspiracje dopasowane
                        do Ciebie.
                    </p>
                </section>

                <SectionTitle>
                    Informacje prawne
                </SectionTitle>

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <MenuLink
                        href="/polityka-prywatnosci"
                        title="Polityka prywatności"
                        description="Dowiedz się, jak przetwarzamy dane."
                    />

                    <div className="ml-5 h-px bg-white/10" />

                    <MenuLink
                        href="/regulamin"
                        title="Regulamin"
                        description="Zasady korzystania z aplikacji."
                    />
                </section>

                <SectionTitle>
                    Kontakt
                </SectionTitle>

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <ExternalMenuLink
                        href={LINKS.email}
                        title="Napisz do nas"
                        description="Wyślij pytanie, opinię lub zgłoszenie."
                    />
                </section>

                <SectionTitle>
                    Media społecznościowe
                </SectionTitle>

                <section className="grid gap-3 sm:grid-cols-2">
                    <a
                        href={LINKS.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-14 items-center justify-center rounded-2xl bg-orange-500 font-semibold transition-colors hover:bg-orange-400"
                    >
                        Instagram
                    </a>

                    <a
                        href={LINKS.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 font-semibold transition-colors hover:bg-blue-500"
                    >
                        Facebook
                    </a>
                </section>

                <SectionTitle>
                    Ustawienia
                </SectionTitle>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h2 className="font-medium">
                        Ustawienia aplikacji
                    </h2>

                    <p className="mt-2 text-sm text-neutral-500">
                        Więcej ustawień pojawi się
                        wkrótce.
                    </p>
                </section>

                <SectionTitle>
                    Wersja aplikacji
                </SectionTitle>

                <section className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <span className="text-sm text-neutral-400">
                        GotujTo
                    </span>

                    <span className="text-sm font-semibold">
                        {appVersion}
                    </span>
                </section>
            </div>
        </main>
    );
}

type SectionTitleProps = {
    children: React.ReactNode;
};

function SectionTitle({
                          children,
                      }: SectionTitleProps) {
    return (
        <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {children}
        </h2>
    );
}

type MenuLinkProps = {
    href: string;
    title: string;
    description: string;
};

function MenuLink({
                      href,
                      title,
                      description,
                  }: MenuLinkProps) {
    return (
        <Link
            href={href}
            className="flex min-h-20 items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
        >
            <div className="flex-1">
                <h3 className="font-medium">
                    {title}
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                    {description}
                </p>
            </div>

            <span
                aria-hidden
                className="text-neutral-600"
            >
                →
            </span>
        </Link>
    );
}

function ExternalMenuLink({
                              href,
                              title,
                              description,
                          }: MenuLinkProps) {
    return (
        <a
            href={href}
            className="flex min-h-20 items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
        >
            <div className="flex-1">
                <h3 className="font-medium">
                    {title}
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                    {description}
                </p>
            </div>

            <span
                aria-hidden
                className="text-neutral-600"
            >
                →
            </span>
        </a>
    );
}