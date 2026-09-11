import {Stack} from "expo-router";
import "../../global.css";
import {ConvexReactClient, ConvexProvider} from "convex/react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {SelectedStoresProvider} from "@/providers/SelectedStoresContext";
import MobileAdsInitializer from "@/components/Ads/MobileAdsInitializer";



const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
});

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <MobileAdsInitializer />

            <BottomSheetModalProvider>
                <ConvexProvider client={convex}>
                    <SelectedStoresProvider>
                        <Stack screenOptions={{headerShown: false}}/>
                    </SelectedStoresProvider>
                </ConvexProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    )
}
