import {View} from "react-native";
import {type ShortItemData} from "@gotujto/shared/types/result-type";
import DealContent from "./DealContent";
import FridgeContent from "./FridgeContent";
import StandardContent from "./StandardContent";

type ShortContentProps = {
    item: ShortItemData;
    onOpenRecipe: () => void;
};

export default function ShortContent({item, onOpenRecipe}: ShortContentProps) {
    const renderContent = () => {
        switch (item.source) {
            case "deals":
                return <DealContent item={item} onOpenRecipe={onOpenRecipe}/>;

            case "fridge":
                return <FridgeContent item={item} onOpenRecipe={onOpenRecipe}/>;

            case "standard":
                return <StandardContent recipe={item.recipe} onOpenRecipe={onOpenRecipe}/>;

            default:
                return assertNever(item);
        }
    };

    return (
        <View pointerEvents="box-none"
              className="absolute inset-0 z-10"
        >
            {renderContent()}
        </View>
    );
}

function assertNever(item: never): never {
    throw new Error(`Nieobsługiwany typ shortsa: ${JSON.stringify(item)}`);
}