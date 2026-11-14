import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_DIAGNOSTICS_KEY = "gotujto:auth-diagnostics";
const MAX_ENTRIES = 80;

export type AuthDiagnosticEntry = {
    at: string;
    event: string;
    details?: Record<string, string | number | boolean>;
};

export async function recordAuthDiagnostic(event: string, details?: AuthDiagnosticEntry["details"]) {
    try {
        const stored = await AsyncStorage.getItem(AUTH_DIAGNOSTICS_KEY);
        const entries: AuthDiagnosticEntry[] = stored ? JSON.parse(stored) : [];
        const nextEntries = [...entries, {at: new Date().toISOString(), event, details}].slice(-MAX_ENTRIES);

        await AsyncStorage.setItem(AUTH_DIAGNOSTICS_KEY, JSON.stringify(nextEntries));
    } catch {
        // Diagnostics must never block sign-in.
    }
}

export async function getAuthDiagnostics() {
    try {
        const stored = await AsyncStorage.getItem(AUTH_DIAGNOSTICS_KEY);

        return stored ? JSON.parse(stored) as AuthDiagnosticEntry[] : [];
    } catch {
        return [];
    }
}

export async function clearAuthDiagnostics() {
    await AsyncStorage.removeItem(AUTH_DIAGNOSTICS_KEY);
}
