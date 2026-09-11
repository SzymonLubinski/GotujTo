import {useMemo} from "react";
import {View} from "react-native";
import {type Doc} from "@gotujto/convex/_generated/dataModel";
import {Text} from "@/components/ui/text";

type RecipeStepsProps = {
    steps: Doc<"steps">[];
};

export default function RecipeSteps({steps}: RecipeStepsProps) {
    const sortedSteps = useMemo(() => {
        return [...steps].sort((a, b) => a.stepNum - b.stepNum);
    }, [steps]);

    return (
        <View>
            <Text className="text-sm text-white/50">
                {sortedSteps.length} kroków
            </Text>

            <Text className="mt-1 text-2xl font-bold text-white">
                Przygotowanie
            </Text>

            <View className="mt-6 gap-5">
                {sortedSteps.map(step => (
                    <View key={step._id}
                          className="flex-row items-start gap-4"
                    >
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-500">
                            <Text className="font-bold text-white">
                                {step.stepNum}
                            </Text>
                        </View>

                        <View className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <Text className="text-lg font-semibold text-white">
                                Krok {step.stepNum}
                            </Text>

                            <Text className="mt-2 text-base leading-7 text-white/65">
                                {step.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}