import {Linking, Platform, Pressable, ScrollView, View} from "react-native";
import Constants from "expo-constants";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {ChevronRight, ExternalLink, FileText, Info, Mail, Settings, ShieldCheck} from "lucide-react-native";
import {Text} from "@/components/ui/text";
import {useBottomTabBarHeight} from "expo-router/js-tabs";

const LINKS = {
    privacyPolicy:
        "https://twoja-strona.pl/polityka-prywatnosci",
    terms:
        "https://twoja-strona.pl/regulamin",
    email:
        "lubinski.szymon.99@gmail.com",
    instagram:
        "https://www.instagram.com/twoje-konto",
    facebook:
        "https://www.facebook.com/twoje-konto",
};

export default function MoreScreen() {
    const tabBarHeight = useBottomTabBarHeight();
    const appVersion =
        Constants.expoConfig?.version ??
        "Brak informacji";

    const buildVersion =
        Platform.OS === "android"
            ? Constants.expoConfig?.android?.versionCode
            : Constants.expoConfig?.ios?.buildNumber;

    const openUrl = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error(
                "Nie można otworzyć adresu:",
                url,
                error,
            );
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-black"
            contentContainerStyle={{
                paddingBottom: tabBarHeight + 32,
            }}
            showsVerticalScrollIndicator={false}
        >
            <View className="px-5 pt-8">
                <Text className="text-3xl font-bold text-white">
                    Więcej
                </Text>

                <Text className="mt-2 text-sm leading-5 text-white/50">
                    Informacje o GotujTo, kontakt oraz
                    ustawienia aplikacji.
                </Text>

                <SectionTitle title="O GotujTo" />

                <View className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-orange-500/15">
                        <Info
                            size={21}
                            color="#fb923c"
                        />
                    </View>

                    <Text className="mt-4 text-xl font-bold text-white">
                        GotujTo
                    </Text>

                    <Text className="mt-2 text-sm leading-6 text-white/60">
                        GotujTo pomaga odkrywać przepisy,
                        wykorzystywać produkty znajdujące się
                        w lodówce oraz znajdować kulinarne
                        inspiracje dopasowane do Ciebie.
                    </Text>
                </View>

                <SectionTitle title="Informacje prawne" />

                <View className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <MenuRow
                        title="Polityka prywatności"
                        description="Dowiedz się, jak przetwarzamy dane."
                        icon={
                            <ShieldCheck
                                size={20}
                                color="#a3e635"
                            />
                        }
                        onPress={() =>
                            openUrl(
                                LINKS.privacyPolicy,
                            )
                        }
                    />

                    <View className="ml-[4.25rem] h-px bg-white/10" />

                    <MenuRow
                        title="Regulamin"
                        description="Zasady korzystania z aplikacji."
                        icon={
                            <FileText
                                size={20}
                                color="#fb923c"
                            />
                        }
                        onPress={() =>
                            openUrl(LINKS.terms)
                        }
                    />
                </View>

                <SectionTitle title="Kontakt" />

                <View className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <MenuRow
                        title="Napisz do nas"
                        description="Wyślij pytanie, opinię lub zgłoszenie."
                        icon={
                            <Mail
                                size={20}
                                color="#60a5fa"
                            />
                        }
                        onPress={() =>
                            openUrl(LINKS.email)
                        }
                    />
                </View>

                <SectionTitle title="Media społecznościowe" />

                <View className="gap-3">
                    <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Otwórz Instagram GotujTo"
                        onPress={() =>
                            openUrl(LINKS.instagram)
                        }
                        className="h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-orange-500 active:bg-orange-400 will-change-pressable"
                    >
                        <FontAwesome6
                            name="instagram"
                            size={20}
                            color="#ffffff"
                        />

                        <Text className="text-base font-semibold text-white">
                            Instagram
                        </Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Otwórz Facebook GotujTo"
                        onPress={() =>
                            openUrl(LINKS.facebook)
                        }
                        className="h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-blue-600 active:bg-blue-500 will-change-pressable"
                    >
                        <FontAwesome6
                            name="facebook-f"
                            size={20}
                            color="#ffffff"
                        />

                        <Text className="text-base font-semibold text-white">
                            Facebook
                        </Text>
                    </Pressable>
                </View>

                <SectionTitle title="Ustawienia" />

                <View className="rounded-2xl border border-white/10 bg-white/5">
                    <View className="min-h-20 flex-row items-center gap-4 px-4 py-3">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                            <Settings
                                size={20}
                                color="rgba(255, 255, 255, 0.65)"
                            />
                        </View>

                        <View className="flex-1">
                            <Text className="text-base font-medium text-white">
                                Ustawienia aplikacji
                            </Text>

                            <Text className="mt-1 text-sm text-white/45">
                                Więcej ustawień pojawi się
                                wkrótce.
                            </Text>
                        </View>
                    </View>
                </View>

                <SectionTitle title="Wersja aplikacji" />

                <View className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <View className="flex-row items-center justify-between gap-4">
                        <Text className="text-sm text-white/60">
                            GotujTo
                        </Text>

                        <Text className="text-sm font-semibold text-white">
                            {appVersion}
                            {buildVersion
                                ? ` (${buildVersion})`
                                : ""}
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

type SectionTitleProps = {
    title: string;
};

function SectionTitle({
                          title,
                      }: SectionTitleProps) {
    return (
        <Text className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-white/40">
            {title}
        </Text>
    );
}

type MenuRowProps = {
    title: string;
    description: string;
    icon: React.ReactNode;
    onPress: () => void;
};

function MenuRow({
                     title,
                     description,
                     icon,
                     onPress,
                 }: MenuRowProps) {
    return (
        <Pressable
            accessibilityRole="link"
            accessibilityLabel={title}
            onPress={onPress}
            className="min-h-20 flex-row items-center gap-4 px-4 py-3 active:bg-white/5 will-change-pressable"
        >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                {icon}
            </View>

            <View className="flex-1">
                <Text className="text-base font-medium text-white">
                    {title}
                </Text>

                <Text className="mt-1 text-sm text-white/45">
                    {description}
                </Text>
            </View>

            <View className="flex-row items-center gap-1">
                <ExternalLink
                    size={15}
                    color="rgba(255, 255, 255, 0.3)"
                />

                <ChevronRight
                    size={18}
                    color="rgba(255, 255, 255, 0.3)"
                />
            </View>
        </Pressable>
    );
}