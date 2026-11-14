import {useRef} from "react";
import {Search, SlidersHorizontal} from "lucide-react-native";
import {Image, Pressable, View} from "react-native";
import {useRouter} from "expo-router";
import {BottomSheetModal} from "@gorhom/bottom-sheet";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button} from "@/components/ui/button";
import {StoresSheet} from "@/components/Nav/StoresSheet";
import {type StoresT} from "@gotujto/shared/data/stableData";


type HomeHeaderProps = {
    selectedStores: StoresT[];
    onSelectedStoresChange: (stores: StoresT[]) => void;
};

export default function HomeHeader({selectedStores, onSelectedStoresChange}: HomeHeaderProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const storesSheetRef = useRef<BottomSheetModal>(null);

    return (
        <>
            <View className="absolute left-0 right-0 z-50 flex-row items-center justify-between px-5"
                  style={{paddingTop: insets.top + 12}}
            >
                <Image
                    source={require("../../../assets/images/brand/gotujto-logo-dark.png")}
                    accessibilityLabel="GotujTo"
                    resizeMode="contain"
                    style={{width: 126, height: 38}}
                />

                <View className="flex-row items-center gap-2">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Szukaj przepisow"
                        onPress={() => router.push("/search" as never)}
                        className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 active:bg-black/70"
                    >
                        <Search size={20} color="#ffffff" strokeWidth={2.2} />
                    </Pressable>
                    <Button variant="outline"
                            size="md"
                            iconAfter={<SlidersHorizontal size={19} color="#ffffff" strokeWidth={2.2} />}
                            className="rounded-full border-white/25 bg-black/50 px-5"
                            textClassName="font-semibold text-white"
                            onPress={() => storesSheetRef.current?.present()}
                    >
                        Sklepy
                    </Button>
                </View>
            </View>
            <StoresSheet ref={storesSheetRef}
                         selectedStores={selectedStores}
                         onSelectedStoresChange={onSelectedStoresChange}
            />
        </>
    );
}
