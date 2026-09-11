'use client'

import {Controller, FieldPath, FieldValues, useFormContext} from "react-hook-form";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {ControllerProps} from "@/lib/types/controllers";

export default function NumberInputController<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>({
      name,
      label,
      placeholder,
  }: ControllerProps<TFieldValues, TName>) {
    const {control} = useFormContext<TFieldValues>();

    return (
        <Controller control={control} name={name} render={({field, fieldState}) => (
            <Field>
                <FieldLabel>{label}</FieldLabel>
                <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder={placeholder}
                    aria-invalid={fieldState.invalid}
                    type="number"
                    onChange={(e) =>
                        field.onChange(
                            e.target.value === "" ? undefined : e.target.valueAsNumber
                        )
                    }
                />
                {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]}/>
                )}
            </Field>
        )}
        />
    )
}