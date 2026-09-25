import Link from "next/link";

const LAST_UPDATED = "25 września 2026 r.";
const CONTACT_EMAIL = "szymon.lubinski.it@gmail.com";

export default function PrivacyPolicyPage() {
    return (
        <>
            <div aria-hidden className="feed-desktop-background" />
            <main className="relative z-10 h-dvh overflow-y-auto bg-black px-5 pb-32 pt-12 text-white lg:bg-transparent feed-desktop-scrollbar-gutter">
                <article className="mx-auto w-full max-w-3xl">
                    <Link href="/more" className="text-sm text-neutral-400 transition-colors hover:text-white">
                        ← Wróć do Więcej
                    </Link>
                    <header className="mt-7 border-b border-white/10 pb-8">
                        <p className="text-sm font-semibold uppercase tracking-wider text-lime-400">GotujTo</p>
                        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Polityka prywatności</h1>
                        <p className="mt-4 text-sm text-neutral-400">Ostatnia aktualizacja: {LAST_UPDATED}</p>
                    </header>

                    <div className="space-y-10 pt-8 text-neutral-300">
                        <Section title="1. Administrator danych">
                            <p>
                                Administratorem danych osobowych jest Szymon Lubiński, prowadzący serwis GotujTo
                                (&bdquo;Administrator&rdquo;). W sprawach dotyczących prywatności oraz realizacji praw
                                związanych z danymi osobowymi można skontaktować się pod adresem: {" "}
                                <a className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                            </p>
                        </Section>
                        <Section title="2. Jakie dane przetwarzamy">
                            <p>W zależności od sposobu korzystania z Serwisu możemy przetwarzać:</p>
                            <ul>
                                <li>dane podane w formularzu kontaktowym: opcjonalny adres e-mail, treść wiadomości, kategorię zgłoszenia oraz — w przypadku zgłoszenia błędu — nazwę, identyfikator i adres przepisu;</li>
                                <li>techniczne dane związane z żądaniem, w tym adres IP przetwarzany przez infrastrukturę Serwisu;</li>
                                <li>jednokierunkowy skrót kryptograficzny adresu IP, używany wyłącznie do ograniczania nadużyć formularza kontaktowego. Nie zapisujemy w tym celu surowego adresu IP.</li>
                            </ul>
                        </Section>
                        <Section title="3. Cele i podstawy przetwarzania">
                            <ul>
                                <li>obsługa wiadomości i zgłoszeń błędów — prawnie uzasadniony interes Administratora polegający na komunikacji z użytkownikiem i poprawianiu Serwisu (art. 6 ust. 1 lit. f RODO);</li>
                                <li>ochrona formularza kontaktowego przed spamem i nadużyciami — prawnie uzasadniony interes Administratora (art. 6 ust. 1 lit. f RODO);</li>
                                <li>zapewnienie działania, bezpieczeństwa i rozliczalności Serwisu — prawnie uzasadniony interes Administratora (art. 6 ust. 1 lit. f RODO).</li>
                            </ul>
                        </Section>
                        <Section title="4. Okres przechowywania">
                            <ul>
                                <li>wiadomości z formularza kontaktowego przechowujemy przez czas potrzebny do obsługi sprawy, nie dłużej niż 12 miesięcy od jej zakończenia, chyba że dłuższe przechowywanie jest konieczne do ustalenia, dochodzenia lub obrony roszczeń;</li>
                                <li>rekord ogranicznika formularza zawierający skrót IP jest automatycznie usuwany najpóźniej po 24 godzinach;</li>
                                <li>dane techniczne w logach usługodawców infrastruktury są przechowywane zgodnie z ich ustawieniami i politykami prywatności.</li>
                            </ul>
                        </Section>
                        <Section title="5. Odbiorcy danych">
                            <p>Korzystamy z dostawców technicznych, którzy przetwarzają dane wyłącznie w zakresie koniecznym do działania Serwisu:</p>
                            <ul>
                                <li>Vercel — hosting i obsługa działania strony;</li>
                                <li>Convex — baza danych, funkcje serwerowe i ogranicznik formularza;</li>
                                <li>Resend — wysyłka wiadomości z formularza kontaktowego;</li>
                                <li>Cloudflare R2 — przechowywanie materiałów wideo Serwisu.</li>
                            </ul>
                            <p>Nie sprzedajemy danych osobowych. Nie wykorzystujemy ich do reklamy behawioralnej ani do podejmowania zautomatyzowanych decyzji wywołujących skutki prawne wobec użytkownika.</p>
                        </Section>
                        <Section title="6. Przekazywanie danych poza EOG">
                            <p>Niektórzy dostawcy infrastruktury mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym. Jeżeli ma to miejsce, przekazanie odbywa się na zasadach przewidzianych przez RODO, w szczególności na podstawie odpowiednich zabezpieczeń stosowanych przez danego dostawcę.</p>
                        </Section>
                        <Section title="7. Cookies i pamięć przeglądarki">
                            <p>Serwis nie używa plików cookies do celów analitycznych, marketingowych ani reklamowych. Nie korzystamy z narzędzi analityki ruchu ani pikseli reklamowych.</p>
                            <p>Dla działania części funkcji Serwis może wykorzystywać <code>sessionStorage</code> przeglądarki, np. do zapamiętania wybranych sklepów lub miejsca powrotu na feedzie. Dane te pozostają na urządzeniu użytkownika i nie są wykorzystywane do śledzenia między stronami. Można je usunąć w ustawieniach przeglądarki.</p>
                        </Section>
                        <Section title="8. Twoje prawa">
                            <p>W granicach przewidzianych prawem przysługuje Ci prawo do:</p>
                            <ul>
                                <li>dostępu do danych i otrzymania ich kopii;</li>
                                <li>sprostowania danych;</li>
                                <li>usunięcia danych lub ograniczenia ich przetwarzania;</li>
                                <li>wniesienia sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie;</li>
                                <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
                            </ul>
                            <p>Aby skorzystać z tych praw, napisz na {" "}<a className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
                        </Section>
                        <Section title="9. Zmiany polityki">
                            <p>Polityka może być aktualizowana, gdy zmieni się sposób działania Serwisu, zakres przetwarzania danych lub przepisy prawa. Aktualna wersja jest zawsze dostępna pod tym adresem.</p>
                        </Section>
                    </div>
                </article>
            </main>
        </>
    );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <div className="space-y-4 leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-white">
                {children}
            </div>
        </section>
    );
}
