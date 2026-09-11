import {useRef} from "react";
import {SlidersHorizontal} from "lucide-react-native";
import {View} from "react-native";
import {BottomSheetModal} from "@gorhom/bottom-sheet";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Button} from "@/components/ui/button";
import {Text} from "@/components/ui/text";
import StoresSheet from "@/components/Nav/StoresSheet";
import {stores, type StoresT} from "@gotujto/shared/data/stableData";


type HomeHeaderProps = {
    selectedStores: StoresT[];
    onSelectedStoresChange: (stores: StoresT[]) => void;
};

export default function HomeHeader({selectedStores, onSelectedStoresChange}: HomeHeaderProps) {
    const insets = useSafeAreaInsets();
    const storesSheetRef = useRef<BottomSheetModal>(null);

    return (
        <>
            <View className="absolute left-0 right-0 z-50 flex-row items-center justify-between px-5"
                  style={{paddingTop: insets.top + 12}}
            >
                <Text className="text-3xl font-black italic tracking-tight text-white">
                    Gotuj<Text className="text-orange-500">To</Text>
                </Text>

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
            <StoresSheet ref={storesSheetRef}
                         selectedStores={selectedStores}
                         onSelectedStoresChange={onSelectedStoresChange}
            />
        </>
    );
}