import {Platform} from "react-native";

export function navigateAfterBlur(callback: () => void) {
    if (
        Platform.OS === "web" &&
        typeof document !== "undefined"
    ) {
        const activeElement = document.activeElement as HTMLElement | null;
        activeElement?.blur();
        requestAnimationFrame(callback);
        return;
    }
    callback();
}