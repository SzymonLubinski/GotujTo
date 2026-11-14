import {useEffect} from "react";
import * as Notifications from "expo-notifications";
import {useRouter} from "expo-router";

function getPath(response: Notifications.NotificationResponse) {
    const path = response.notification.request.content.data?.path;
    return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : null;
}

export function PushNotificationHandler() {
    const router = useRouter();

    useEffect(() => {
        const openNotification = (response: Notifications.NotificationResponse) => {
            const path = getPath(response);
            if (path) router.push(path as never);
        };
        const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);

        void Notifications.getLastNotificationResponseAsync().then(response => {
            if (response) openNotification(response);
        });

        return () => subscription.remove();
    }, [router]);

    return null;
}
