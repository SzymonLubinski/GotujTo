import {FieldPath, FieldValues} from "react-hook-form";
import {Id} from "@gotujto/convex/_generated/dataModel";

export type ControllerProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> = {
    name: TName;
    label: string;
    placeholder?: string;
};

export type OptionsControllerProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> = ControllerProps<TFieldValues, TName> & {
    items: {
        key: string | Id<'products'>
        value?: string;
    }[]
};