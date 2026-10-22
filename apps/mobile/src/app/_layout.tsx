import {Stack} from "expo-router";
import "../../global.css";
import {ConvexReactClient} from "convex/react";
import {ConvexBetterAuthProvider} from "@convex-dev/better-auth/react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import {SelectedStoresProvider} from "@/providers/SelectedStoresContext";
import {ToastProvider} from "@/components/ui/toast";
import {authClient} from "@/lib/auth-client";



const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
});

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <BottomSheetModalProvider>
                <ConvexBetterAuthProvider
                    client={convex}
                    authClient={authClient as never}
                >
                    <SelectedStoresProvider>
                        <ToastProvider>
                            <Stack screenOptions={{headerShown: false}}/>
                        </ToastProvider>
                    </SelectedStoresProvider>
                </ConvexBetterAuthProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    )
}
