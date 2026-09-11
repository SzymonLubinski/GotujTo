"use client";

import {Controller, FieldPath, FieldValues, useFormContext} from "react-hook-form";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {OptionsControllerProps} from "@/lib/types/controllers";


export default function SelectController<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>({
      name,
      label,
      placeholder,
      items,
  }: OptionsControllerProps<TFieldValues, TName>) {
    const {control} = useFormContext<TFieldValues>();

    return (
        <Controller
            control={control}
            name={name}
            render={({field, fieldState}) => (
                <Field>
                    <FieldLabel>{label}</FieldLabel>

                    <Select
                        value={field.value}
                        onValueChange={field.onChange}
                    >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder={placeholder}/>
                        </SelectTrigger>

                        <SelectContent>
                            {items.map((item) => (
                                <SelectItem
                                    key={item.key}
                                    value={item.key}
                                >
                                    {item.value ? item.value : item.key}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]}/>
                    )}
                </Field>
            )}
        />
    );
}