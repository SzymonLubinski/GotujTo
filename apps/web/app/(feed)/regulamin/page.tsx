import Link from "next/link";

const LAST_UPDATED = "14 października 2026 r.";
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
                            <p>Korzystanie z Serwisu jest nieodpłatne. Przeglądanie publicznych treści nie wymaga utworzenia konta. Część funkcji, w tym dodawanie komentarzy, ulubionych, własnej lodówki oraz zgłaszanie przepisu lub wpisu blogowego, wymaga zalogowania.</p>
                        </Section>

                        <Section title="2. Zakres usług">
                            <p>Serwis umożliwia w szczególności:</p>
                            <ul>
                                <li>przeglądanie przepisów kulinarnych i wpisów blogowych;</li>
                                <li>wyszukiwanie inspiracji na podstawie produktów wybranych przez użytkownika;</li>
                                <li>przeglądanie informacji o promocjach sklepowych;</li>
                                <li>założenie konta, zapisywanie ulubionych oraz prowadzenie listy produktów w lodówce;</li>
                                <li>dodawanie komentarzy, zgłaszanie przepisów i wpisów blogowych do weryfikacji;</li>
                                <li>wysyłanie wiadomości i zgłoszeń błędów przez formularz kontaktowy.</li>
                            </ul>
                            <p>Zakres Serwisu może być rozwijany, zmieniany lub ograniczany ze względów technicznych, organizacyjnych albo prawnych.</p>
                        </Section>

                        <Section title="3. Konto użytkownika i logowanie">
                            <p>Konto można utworzyć za pomocą adresu e-mail i hasła albo przez logowanie z użyciem konta Google. Rejestracja przy użyciu adresu e-mail wymaga potwierdzenia adresu przez link aktywacyjny wysłany na podany adres.</p>
                            <p>Użytkownik ma obowiązek podać prawdziwe dane, chronić hasło i nie udostępniać dostępu do konta innym osobom. W razie podejrzenia nieuprawnionego dostępu powinien niezwłocznie zmienić hasło lub skontaktować się z Usługodawcą.</p>
                            <p>Użytkownik może w każdej chwili usunąć konto z poziomu ustawień profilu. Podczas usuwania konta może zdecydować, czy zatwierdzone przepisy mają zostać usunięte, czy pozostać opublikowane pod autorstwem GotujTo. Zasady przetwarzania danych po usunięciu konta opisuje Polityka prywatności.</p>
                        </Section>

                        <Section title="4. Treści użytkowników, komentarze i profile publiczne">
                            <p>Użytkownik może zgłosić własny przepis lub wpis blogowy. Zgłoszenie nie jest publikowane automatycznie: przed publikacją wymaga weryfikacji i zatwierdzenia przez Usługodawcę.</p>
                            <p>Dodając treść, zdjęcie lub materiał wideo, użytkownik oświadcza, że ma do nich odpowiednie prawa oraz że ich publikacja nie narusza praw osób trzecich, w tym praw autorskich, dóbr osobistych, prywatności ani przepisów prawa.</p>
                            <p>W zakresie niezbędnym do publikacji w Serwisie użytkownik udziela Usługodawcy nieodpłatnej, niewyłącznej licencji na korzystanie z dodanej treści: jej utrwalanie, wyświetlanie, publiczne udostępnianie w Serwisie oraz techniczne dostosowanie do działania Serwisu. Licencja obowiązuje przez czas publikacji treści, a dla treści pozostawionej po usunięciu konta — przez czas jej dalszej publikacji.</p>
                            <p>Nazwa wyświetlana użytkownika i avatar mogą być publicznie widoczne przy zatwierdzonych treściach oraz na publicznym profilu. Komentarze są również publiczne. Nie należy publikować w nich danych osobowych, których użytkownik nie chce upublicznić, ani danych osób trzecich bez odpowiedniej podstawy.</p>
                            <p>Usługodawca może odmówić publikacji, odrzucić lub usunąć treść naruszającą Regulamin, prawo, prawa osób trzecich albo zasady współżycia społecznego.</p>
                        </Section>

                        <Section title="5. Wymagania techniczne">
                            <p>Do korzystania z Serwisu potrzebne są:</p>
                            <ul>
                                <li>urządzenie z dostępem do Internetu;</li>
                                <li>aktualna przeglądarka internetowa z włączoną obsługą JavaScript;</li>
                                <li>aktywny adres e-mail — jeżeli użytkownik zakłada konto przez e-mail, chce zresetować hasło albo otrzymać odpowiedź na wiadomość.</li>
                            </ul>
                            <p>Korzystanie z usług elektronicznych wiąże się ze zwykłymi zagrożeniami występującymi w Internecie, w tym ryzykiem działania złośliwego oprogramowania lub prób wyłudzenia danych. Użytkownik powinien stosować aktualne oprogramowanie i podstawowe środki bezpieczeństwa.</p>
                        </Section>

                        <Section title="6. Przepisy i informacje kulinarne">
                            <p>Przepisy mają charakter informacyjny i inspiracyjny. Użytkownik powinien samodzielnie uwzględnić alergie, nietolerancje, dietę, stan zdrowia oraz informacje znajdujące się na etykietach używanych produktów.</p>
                            <p>Serwis nie stanowi porady medycznej, dietetycznej ani żywieniowej.</p>
                        </Section>

                        <Section title="7. Promocje sklepowe">
                            <p>Informacje o promocjach są wprowadzane do Serwisu ręcznie na podstawie gazetek, materiałów promocyjnych i innych dostępnych informacji. Nie są one ofertą handlową sklepów ani zapewnieniem dostępności produktu.</p>
                            <p>Mimo staranności mogą wystąpić błędy w danych, w tym w cenie, terminie, warunkach promocji, nazwie produktu lub interpretacji gazetki. Sklep może również zmienić albo wycofać promocję bez uprzedzenia.</p>
                            <p>Przed zakupem użytkownik powinien potwierdzić cenę, dostępność, datę obowiązywania i warunki promocji bezpośrednio w sklepie lub w jego oficjalnych materiałach. Usługodawca nie gwarantuje aktualności ani kompletności informacji promocyjnych, co nie ogranicza praw użytkownika wynikających z bezwzględnie obowiązujących przepisów prawa.</p>
                        </Section>

                        <Section title="8. Zasady korzystania">
                            <p>Użytkownik zobowiązuje się w szczególności do:</p>
                            <ul>
                                <li>korzystania z Serwisu zgodnie z prawem i dobrymi obyczajami;</li>
                                <li>niedostarczania treści bezprawnych, obraźliwych, wprowadzających w błąd lub naruszających prawa osób trzecich;</li>
                                <li>niepublikowania spamu, reklam, złośliwego oprogramowania ani treści niezwiązanych z funkcjami Serwisu;</li>
                                <li>niepodejmowania działań zakłócających działanie Serwisu, w tym prób automatycznego masowego zakładania kont, wysyłania formularzy lub pobierania danych.</li>
                            </ul>
                            <p>Usługodawca może czasowo ograniczyć dostęp do Serwisu, gdy jest to potrzebne do prac technicznych, bezpieczeństwa, usunięcia awarii lub przeciwdziałania nadużyciom.</p>
                        </Section>

                        <Section title="9. Formularz kontaktowy i reklamacje">
                            <p>Zgłoszenia dotyczące działania Serwisu, przepisu lub promocji można przesłać przez formularz kontaktowy albo e-mailem na {" "}<a className="text-lime-300 underline underline-offset-4 hover:text-lime-200" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
                            <p>Zgłoszenie powinno zawierać opis sprawy oraz — jeśli to potrzebne do odpowiedzi — dane kontaktowe. Usługodawca odpowie bez zbędnej zwłoki, co do zasady w ciągu 14 dni od otrzymania kompletnego zgłoszenia.</p>
                        </Section>

                        <Section title="10. Własność intelektualna">
                            <p>Elementy Serwisu, w tym jego nazwa, interfejs, grafiki i układ treści, mogą podlegać ochronie prawnej. Korzystanie z treści Serwisu jest dozwolone na użytek własny w granicach przewidzianych przez prawo. Inne wykorzystanie wymaga zgody uprawnionego podmiotu, o ile przepisy prawa nie stanowią inaczej.</p>
                        </Section>

                        <Section title="11. Zawarcie i zakończenie korzystania z usługi">
                            <p>Rozpoczęcie korzystania z funkcji Serwisu oznacza zawarcie umowy o świadczenie usług drogą elektroniczną na zasadach niniejszego Regulaminu. Użytkownik może zakończyć korzystanie z usługi w każdej chwili przez opuszczenie Serwisu, a w przypadku konta — także przez jego usunięcie w ustawieniach profilu.</p>
                        </Section>

                        <Section title="12. Zmiany regulaminu i prawo właściwe">
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
