import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { Portal } from "@rn-primitives/portal";
import {CheckCircle2, CircleAlert, Info, X} from "lucide-react-native";
import { entering, exiting } from "./animate";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive" | "success";
export type ToastPosition = "top" | "bottom";
export type ToastFrom = "top" | "bottom" | "left" | "right";
type ToastData = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  from?: ToastFrom;
};
const positions: ToastPosition[] = ["top", "bottom"];
// Monotonic id — Date.now() collides for toasts fired in the same millisecond.
let nextId = 0;
const ToastContext = createContext<{ toast: (data: Omit<ToastData, "id">) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export interface ToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
  defaultFrom?: ToastFrom;
}

// Reanimated naming: SlideIn<Side> = the element STARTS on that side, so
// `from: "top"` maps to SlideInUp; exits mirror in the same direction.
const animationFor = {
  top: {enter: entering.slideInUp, exit: exiting.slideOutUp},
  bottom: {enter: entering.slideInDown, exit: exiting.slideOutDown},
  left: {enter: entering.slideInLeft, exit: exiting.slideOutLeft},
  right: {enter: entering.slideInRight, exit: exiting.slideOutRight},
};

const containerStyles: Record<ToastPosition, string> = {
  top:    "absolute top-14 start-4 end-4 gap-2 z-50",
  bottom: "absolute bottom-14 start-4 end-4 gap-2 z-50",
};

export function ToastProvider({ children, defaultPosition = "top", defaultFrom }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((data: Omit<ToastData, "id">) => {
    const id = String(++nextId);
    const position = data.position ?? defaultPosition;
    const from = data.from ?? defaultFrom ?? position;
    setToasts((prev) => [...prev, { ...data, id, position, from }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 3000));
  }, [defaultPosition, defaultFrom, dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Portal anchors toasts to the screen, not the provider's ancestor. */}
      <Portal name="aniui-toast">
        {positions.map((pos) => {
          const items = toasts.filter((t) => t.position === pos);
          if (items.length === 0) return null;
          return (
            <View key={pos} className={containerStyles[pos]} pointerEvents="box-none">
              {items.map((t) => (
                <ToastItem key={t.id} data={t} onDismiss={() => dismiss(t.id)} />
              ))}
            </View>
          );
        })}
      </Portal>
    </ToastContext.Provider>
  );
}

const variantStyles: Record<ToastVariant, string> = {
  default: "border-white/15 bg-zinc-900",
  destructive: "border-red-400/30 bg-red-950",
  success: "border-emerald-400/30 bg-emerald-950",
};

function ToastItem({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const variant = data.variant ?? "default";
  const { enter, exit } = animationFor[data.from ?? "top"];
  const decoration = variant === "success"
    ? {icon: <CheckCircle2 size={20} color="#86efac" />, title: "text-emerald-50", description: "text-emerald-100/70"}
    : variant === "destructive"
      ? {icon: <CircleAlert size={20} color="#fca5a5" />, title: "text-red-50", description: "text-red-100/70"}
      : {icon: <Info size={20} color="#bef264" />, title: "text-white", description: "text-white/60"};

  return (
    <Animated.View entering={enter} exiting={exit}>
      <Pressable
        className={cn("flex-row items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl", variantStyles[variant])}
        onPress={onDismiss}
        accessible={true}
        accessibilityRole="alert"
      >
        <View className="mt-0.5">{decoration.icon}</View>
        <View className="flex-1">
          <Text className={cn("text-sm font-semibold", decoration.title)}>{data.title}</Text>
          {data.description && <Text className={cn("mt-1 text-xs leading-5", decoration.description)}>{data.description}</Text>}
        </View>
        <X size={17} color="rgba(255,255,255,0.45)" />
      </Pressable>
    </Animated.View>
  );
}
