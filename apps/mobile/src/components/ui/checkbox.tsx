import React from "react";
import { Pressable, View, useColorScheme } from "react-native";
import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ checked = false, onCheckedChange, className, disabled, ...props }: CheckboxProps) {
  const dark = useColorScheme() === "dark";
    const isChecked = checked ?? false;
    const handleCheckedChange = onCheckedChange ?? (() => undefined);

  return (
    <CheckboxPrimitive.Root
      checked={isChecked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled ?? undefined}
      asChild
    >
      <Pressable
        className="min-h-12 min-w-12 items-center justify-center"
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked, disabled: !!disabled }}
        onPress={() => !disabled && handleCheckedChange(!isChecked)}
        {...props}
      >
        <View
          className={cn(
            "h-5 w-5 items-center justify-center rounded border",
            isChecked ? "border-primary bg-primary" : "border-input bg-background",
            disabled && "opacity-50",
            className
          )}
        >
          <CheckboxPrimitive.Indicator>
            <Check size={14} color={dark ? "#18181b" : "#fafafa"} strokeWidth={3} />
          </CheckboxPrimitive.Indicator>
        </View>
      </Pressable>
    </CheckboxPrimitive.Root>
  );
}
