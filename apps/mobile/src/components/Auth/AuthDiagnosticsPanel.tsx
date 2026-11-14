import {useState} from "react";
import {Pressable, View} from "react-native";

import {Text} from "@/components/ui/text";
import {clearAuthDiagnostics, getAuthDiagnostics, type AuthDiagnosticEntry} from "@/lib/authDiagnostics";

type AuthDiagnosticsPanelProps = {
    betterAuth: "loading" | "session" | "no-session";
    convex: "loading" | "authenticated" | "not-authenticated";
};

export function AuthDiagnosticsPanel({betterAuth, convex}: AuthDiagnosticsPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [entries, setEntries] = useState<AuthDiagnosticEntry[]>([]);

    async function showDiagnostics() {
        setEntries(await getAuthDiagnostics());
        setIsOpen(true);
    }

    async function clearDiagnostics() {
        await clearAuthDiagnostics();
        setEntries([]);
    }

    if (!isOpen) {
        return <Pressable onPress={() => void showDiagnostics()} className="mt-6 items-center py-2"><Text className="text-xs text-white/45">Diagnostyka logowania</Text></Pressable>;
    }

    return <View className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3">
        <Text className="text-sm font-semibold text-white">Diagnostyka logowania</Text>
        <Text className="mt-2 text-xs text-white/65">Better Auth: {betterAuth} · Convex: {convex}</Text>
        <View className="mt-3 gap-2">
            {entries.length === 0 ? <Text className="text-xs text-white/50">Brak zapisanych zdarzen.</Text> : entries.map((entry, index) => <Text key={`${entry.at}-${index}`} className="text-xs leading-4 text-white/65">{entry.at.slice(11, 19)} — {entry.event}{entry.details ? ` (${Object.entries(entry.details).map(([key, value]) => `${key}: ${value}`).join(", ")})` : ""}</Text>)}
        </View>
        <View className="mt-3 flex-row gap-4">
            <Pressable onPress={() => void showDiagnostics()}><Text className="text-xs font-semibold text-lime-300">Odswiez</Text></Pressable>
            <Pressable onPress={() => void clearDiagnostics()}><Text className="text-xs font-semibold text-red-200">Wyczysc</Text></Pressable>
        </View>
    </View>;
}
