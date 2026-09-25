import Link from "next/link";

const LAST_UPDATED = "25 września 2026 r.";
const CONTACT_EMAIL = "szymon.lubinski.it@gmail.com";

export default function TermsPage() {
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
                        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Regulamin</h1>
                        <p className="mt-4 text-sm text-neutral-400">Obowiązuje od: {LAST_UPDATED}</p>
                    </header>

                    <div className="space-y-10 pt-8 text-neutral-300">
                        <Section title="1. Postanowienia ogólne">
                            <p>Regulamin określa zasady korzystania z serwisu internetowego GotujTo (&bdquo;Serwis&rdquo;), dostępnego pod adresem gotuj-to.vercel.app.</p>
                            <p>Usługodawcą jest Szymon Lubiński. Kontakt z Usługodawcą jest możliwy pod adresem: {" "}<a className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
                            <p>Korzystanie z Serwisu jest nieodpłatne i nie wymaga utworzenia konta.</p>
                        </Section>
                        <Section title="2. Zakres usług">
                            <p>Serwis umożliwia w szczególności:</p>
                            <ul>
                                <li>przeglądanie przepisów kulinarnych;</li>
                                <li>wyszukiwanie inspiracji na podstawie produktów wybranych przez użytkownika;</li>
                                <li>przeglądanie informacji o promocjach sklepowych;</li>
                                <li>wysyłanie wiadomości i zgłoszeń błędów przez formularz kontaktowy.</li>
                            </ul>
                            <p>Zakres Serwisu może być rozwijany, zmieniany lub ograniczany ze względów technicznych, organizacyjnych albo prawnych.</p>
                        </Section>
                        <Section title="3. Wymagania techniczne">
                            <p>Do korzystania z Serwisu potrzebne są:</p>
                            <ul>
                                <li>urządzenie z dostępem do Internetu;</li>
                                <li>aktualna przeglądarka internetowa z włączoną obsługą JavaScript;</li>
                                <li>aktywny adres e-mail — tylko jeśli użytkownik chce otrzymać odpowiedź na wiadomość.</li>
                            </ul>
                            <p>Korzystanie z usług elektronicznych wiąże się ze zwykłymi zagrożeniami występującymi w Internecie, w tym ryzykiem działania złośliwego oprogramowania lub prób wyłudzenia danych. Użytkownik powinien stosować aktualne oprogramowanie i podstawowe środki bezpieczeństwa.</p>
                        </Section>
                        <Section title="4. Przepisy i informacje kulinarne">
                            <p>Przepisy mają charakter informacyjny i inspiracyjny. Użytkownik powinien samodzielnie uwzględnić alergie, nietolerancje, dietę, stan zdrowia oraz informacje znajdujące się na etykietach używanych produktów.</p>
                            <p>Serwis nie stanowi porady medycznej, dietetycznej ani żywieniowej.</p>
                        </Section>
                        <Section title="5. Promocje sklepowe">
                            <p>Informacje o promocjach są wprowadzane do Serwisu ręcznie na podstawie gazetek, materiałów promocyjnych i innych dostępnych informacji. Nie są one ofertą handlową sklepów ani zapewnieniem dostępności produktu.</p>
                            <p>Mimo staranności mogą wystąpić błędy w danych, w tym w cenie, terminie, warunkach promocji, nazwie produktu lub interpretacji gazetki. Sklep może również zmienić albo wycofać promocję bez uprzedzenia.</p>
                            <p>Przed zakupem użytkownik powinien potwierdzić cenę, dostępność, datę obowiązywania i warunki promocji bezpośrednio w sklepie lub w jego oficjalnych materiałach. Usługodawca nie gwarantuje aktualności ani kompletności informacji promocyjnych, co nie ogranicza praw użytkownika wynikających z bezwzględnie obowiązujących przepisów prawa.</p>
                        </Section>
                        <Section title="6. Zasady korzystania">
                            <p>Użytkownik zobowiązuje się w szczególności do:</p>
                            <ul>
                                <li>korzystania z Serwisu zgodnie z prawem i dobrymi obyczajami;</li>
                                <li>niedostarczania treści bezprawnych, obraźliwych lub naruszających prawa osób trzecich;</li>
                                <li>niepodejmowania działań zakłócających działanie Serwisu, w tym prób automatycznego masowego wysyłania formularzy.</li>
                            </ul>
                            <p>Usługodawca może czasowo ograniczyć dostęp do Serwisu, gdy jest to potrzebne do prac technicznych, bezpieczeństwa lub usunięcia awarii.</p>
                        </Section>
                        <Section title="7. Formularz kontaktowy i reklamacje">
                            <p>Zgłoszenia dotyczące działania Serwisu, przepisu lub promocji można przesłać przez formularz kontaktowy albo e-mailem na {" "}<a className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
                            <p>Zgłoszenie powinno zawierać opis sprawy oraz — jeśli to potrzebne do odpowiedzi — dane kontaktowe. Usługodawca odpowie bez zbędnej zwłoki, co do zasady w ciągu 14 dni od otrzymania kompletnego zgłoszenia.</p>
                        </Section>
                        <Section title="8. Własność intelektualna">
                            <p>Elementy Serwisu, w tym jego nazwa, interfejs, grafiki i układ treści, mogą podlegać ochronie prawnej. Korzystanie z treści Serwisu jest dozwolone na użytek własny w granicach przewidzianych przez prawo. Inne wykorzystanie wymaga zgody uprawnionego podmiotu, o ile przepisy prawa nie stanowią inaczej.</p>
                        </Section>
                        <Section title="9. Zawarcie i zakończenie korzystania z usługi">
                            <p>Rozpoczęcie korzystania z funkcji Serwisu oznacza zawarcie umowy o świadczenie usług drogą elektroniczną na zasadach niniejszego Regulaminu. Użytkownik może zakończyć korzystanie z usługi w każdej chwili przez opuszczenie Serwisu.</p>
                        </Section>
                        <Section title="10. Zmiany regulaminu i prawo właściwe">
                            <p>Regulamin może zostać zmieniony z ważnych przyczyn, w szczególności w razie zmiany funkcjonalności Serwisu, przepisów prawa lub wymagań bezpieczeństwa. Nowa wersja zostanie opublikowana na tej stronie i będzie obowiązywać od wskazanej daty.</p>
                            <p>W sprawach nieuregulowanych Regulaminem stosuje się prawo polskie oraz bezwzględnie obowiązujące przepisy chroniące konsumentów.</p>
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
            <div className="space-y-4 leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                {children}
            </div>
        </section>
    );
}
