import type {ComponentProps} from "react";
import {View} from "react-native";
import {Tabs} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import BottomNavItem from "@/components/Nav/BottomNavItem";

type TabsProps = ComponentProps<typeof Tabs>;
type TabBarRenderer = NonNullable<TabsProps["tabBar"]>;
type BottomNavProps = Parameters<TabBarRenderer>[0];

export default function BottomNav({state, descriptors, navigation}: BottomNavProps) {
    const insets = useSafeAreaInsets();

    return (
        <View className="absolute bottom-0 left-0 right-0 z-50 flex-row justify-evenly border-t border-white/10 bg-black px-2 pt-2"
              style={{paddingBottom: Math.max(insets.bottom, 8)}}
        >
            {state.routes.map((route, index) => {
                const descriptor = descriptors[route.key];
                const options = descriptor.options;
                if (!options.tabBarIcon) {
                    return null;
                }

                const isActive = state.index === index;

                const label =
                    typeof options.tabBarLabel === "string"
                        ? options.tabBarLabel
                        : options.title ?? route.name;

                const color = isActive
                    ? "#f97316"
                    : "#a3a3a3";

                const icon = options.tabBarIcon?.({
                    focused: isActive,
                    color,
                    size: 24,
                });

                const handlePress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isActive && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const handleLongPress = () => {
                    navigation.emit({
                        type: "tabLongPress",
                        target: route.key,
                    });
                };

                return (
                    <BottomNavItem key={route.key}
                                   label={label}
                                   icon={icon}
                                   isActive={isActive}
                                   onPress={handlePress}
                                   onLongPress={handleLongPress}
                    />
                );
            })}
        </View>
    );
}