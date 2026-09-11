import type {ReactNode} from "react";
import {Pressable} from "react-native";
import {Text} from "@/components/ui/text";

type BottomNavItemProps = {
    label: string;
    icon: ReactNode;
    isActive: boolean;
    onPress: () => void;
    onLongPress?: () => void;
};

export default function BottomNavItem({label, icon, isActive, onPress, onLongPress}: BottomNavItemProps) {
    return (
        <Pressable accessibilityRole="tab"
                   accessibilityState={{selected: isActive}}
                   onPress={onPress}
                   onLongPress={onLongPress}
                   className={
                       isActive
                           ? "min-w-16 items-center gap-1 rounded-xl bg-orange-500/15 px-3 py-2"
                           : "min-w-16 items-center gap-1 px-3 py-2"
                   }
        >
            {icon}

            <Text className={
                isActive
                    ? "text-xs font-semibold text-orange-500"
                    : "text-xs text-neutral-400"
            }>
                {label}
            </Text>
        </Pressable>
    );
}