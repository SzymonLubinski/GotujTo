import {Controller, FieldPath, FieldValues, useFormContext} from "react-hook-form";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {ControllerProps} from "@/lib/types/controllers";

export default function InputImageController<
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
                    type="file"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        field.onChange(file)
                    }}
                />
                {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]}/>
                )}
            </Field>
        )}
        />
    )
}