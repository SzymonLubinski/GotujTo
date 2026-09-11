import {Controller, FieldPath, FieldValues, useFormContext} from "react-hook-form";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {ControllerProps} from "@/lib/types/controllers";

export default function DateTimeController<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>({
      name,
      label,
      placeholder,
  }: ControllerProps<TFieldValues, TName>) {
    const {control} = useFormContext<TFieldValues>();

    return (
        <Controller
            control={control}
            name={name}
            render={({field, fieldState}) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{label}</FieldLabel>
                    <Input {...field} type="datetime-local" aria-invalid={fieldState.invalid}/>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                </Field>
            )}
        />
    )
}