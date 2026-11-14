import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {Platform} from "react-native";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function requestExpoPushToken() {
    if (!Device.isDevice) {
        throw new Error("Powiadomienia push działają tylko na fizycznym urządzeniu.");
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "GotujTo",
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    const permissions = await Notifications.getPermissionsAsync();
    const status = permissions.granted
        ? permissions.status
        : (await Notifications.requestPermissionsAsync()).status;

    if (status !== "granted") {
        throw new Error("Brak zgody systemowej na powiadomienia.");
    }

    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        throw new Error("Brakuje identyfikatora projektu Expo dla powiadomień.");
    }

    const token = (await Notifications.getExpoPushTokenAsync({projectId})).data;
    const platform = Platform.OS === "ios" ? "ios" : "android";

    return {token, platform} as const;
}
