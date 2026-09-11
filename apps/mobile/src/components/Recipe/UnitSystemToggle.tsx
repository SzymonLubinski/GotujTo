import {Pressable, View} from "react-native";
import {Ruler} from "lucide-react-native";
import {Text} from "@/components/ui/text";

export type UnitSystem = "metric" | "customary";

type UnitSystemToggleProps = {
    value: UnitSystem;
    onValueChange: (value: UnitSystem) => void;
};

export default function UnitSystemToggle({value, onValueChange}: UnitSystemToggleProps) {
    return (
        <View className="w-52 shrink-0">
            <View className="mb-2 flex-row items-center gap-2">
                <Ruler
                    size={16}
                    color="rgba(255, 255, 255, 0.55)"
                />

                <Text className="text-sm text-white/55">
                    Jednostki
                </Text>
            </View>

            <View className="flex-row rounded-xl border border-white/10 bg-white/5 p-1">
                <UnitButton
                    label="Metryczne"
                    active={value === "metric"}
                    onPress={() => onValueChange("metric")}
                />

                <UnitButton
                    label="Użytkowe"
                    active={value === "customary"}
                    onPress={() => onValueChange("customary")}
                />
            </View>
        </View>
    );
}

type UnitButtonProps = {
    label: string;
    active: boolean;
    onPress: () => void;
};

function UnitButton({label, active, onPress}: UnitButtonProps) {
    return (
        <Pressable accessibilityRole="radio"
                   accessibilityState={{checked: active}}
                   className={active
                       ? "flex-1 items-center rounded-lg bg-orange-500 px-3 py-2 will-change-pressable"
                       : "flex-1 items-center rounded-lg px-3 py-2 active:bg-white/5 will-change-pressable"
                   }
                   onPress={onPress}
        >
            <Text className={active
                ? "text-sm font-semibold text-white"
                : "text-sm font-medium text-white/55"
            }>
                {label}
            </Text>
        </Pressable>
    );
}