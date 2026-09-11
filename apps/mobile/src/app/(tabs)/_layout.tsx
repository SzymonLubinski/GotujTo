import {Tabs} from "expo-router";
import {Ellipsis, Home, Search} from "lucide-react-native";
import BottomNav from "@/components/Nav/BottomNav";

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{headerShown: false}}
              tabBar={(props) => <BottomNav {...props} />}
        >
            <Tabs.Screen name="index"
                         options={{
                             title: "Główna",
                             tabBarIcon: ({color, size}) => (
                                 <Home size={size}
                                       color={color}
                                 />
                             ),
                         }}
            />
            <Tabs.Screen name="fridge/index"
                         options={{
                             title: "Lodówka",
                             tabBarIcon: ({color, size}) => (
                                 <Search size={size}
                                         color={color}
                                 />
                             ),
                         }}
            />
            <Tabs.Screen
                name="more/index"
                options={{
                    title: "Więcej",
                    tabBarIcon: ({color, size}) => (
                        <Ellipsis
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
            <Tabs.Screen name="fridge/results/index"
                         options={{
                             href: null,
                         }}
            />
        </Tabs>
    );
}