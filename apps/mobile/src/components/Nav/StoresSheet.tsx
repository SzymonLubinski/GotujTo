import {forwardRef, useEffect, useState} from "react";
import {Check, Store} from "lucide-react-native";
import {Pressable, View} from "react-native";
import {BottomSheetModal} from "@gorhom/bottom-sheet";
import {BottomSheet} from "@/components/ui/bottom-sheet";
import {Text} from "@/components/ui/text";
import {stores, type StoresT} from "@gotujto/shared/data/stableData";

type StoresSheetProps = {
    selectedStores: StoresT[];
    onSelectedStoresChange: (stores: StoresT[]) => void;
};

export const StoresSheet = forwardRef<BottomSheetModal, StoresSheetProps>(
    function StoresSheet(
        {selectedStores, onSelectedStoresChange},
        ref,
    ) {
        const [draftStores, setDraftStores] = useState<StoresT[]>([
            ...selectedStores,
        ]);

        useEffect(() => {
            setDraftStores([...selectedStores]);
        }, [selectedStores]);

        const toggleStore = (store: StoresT) => {
            setDraftStores(previous =>
                previous.includes(store)
                    ? previous.filter(item => item !== store)
                    : [...previous, store],
            );
        };

        const handleDismiss = () => {
            const normalizedStores = stores.filter(store =>
                draftStores.includes(store),
            );

            const normalizedSelectedStores = stores.filter(store =>
                selectedStores.includes(store),
            );

            const hasChanged =
                normalizedStores.length !== normalizedSelectedStores.length ||
                normalizedStores.some(
                    (store, index) => store !== normalizedSelectedStores[index],
                );

            if (hasChanged) {
                onSelectedStoresChange(normalizedStores);
            }
        };

        return (
            <BottomSheet ref={ref}
                         snapPoints={["70%"]}
                         onDismiss={handleDismiss}
            >
                <View className="flex-1 px-5 pb-8">
                    <View className="mb-6">
                        <Text className="text-2xl font-bold text-foreground">
                            Wybierz sklepy
                        </Text>

                        <Text className="mt-1 text-sm text-muted-foreground">
                            Wybierz promocje z:
                        </Text>
                    </View>

                    <View className="gap-3">
                        {stores.map(store => {
                            const selected = draftStores.includes(store);

                            return (
                                <Pressable key={store}
                                           className={selected
                                               ? "flex-row items-center justify-between rounded-2xl border border-orange-500 bg-orange-500/10 px-4"
                                               : "flex-row items-center justify-between rounded-2xl border border-border bg-card px-4"
                                           }
                                           onPress={() => toggleStore(store)}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View className={selected
                                            ? "h-12 w-12 items-center justify-center rounded-xl bg-orange-500"
                                            : "h-12 w-12 items-center justify-center rounded-xl bg-muted"
                                        }>
                                            <Store size={22}
                                                   color={selected ? "#ffffff" : "#737373"}
                                                   strokeWidth={2}
                                            />
                                        </View>

                                        <Text className="text-base font-semibold text-foreground">
                                            {store}
                                        </Text>
                                    </View>

                                    <View className={selected
                                        ? "h-7 w-7 items-center justify-center rounded-full bg-orange-500"
                                        : "h-7 w-7 items-center justify-center rounded-full border border-border"
                                    }>
                                        {selected && (
                                            <Check size={16}
                                                   color="#ffffff"
                                                   strokeWidth={3}
                                            />
                                        )}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </BottomSheet>
        );
    },
);

StoresSheet.displayName = "StoresSheet";

export default StoresSheet;