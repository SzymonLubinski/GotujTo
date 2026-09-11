"use client";

import {Controller, type FieldPath, type FieldValues, useFormContext} from "react-hook-form";
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {type OptionsControllerProps} from "@/lib/types/controllers";

export default function ComboboxController<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>({
      name,
      label,
      items,
  }: OptionsControllerProps<TFieldValues, TName>) {
    const {control} = useFormContext<TFieldValues>();
    const anchor = useComboboxAnchor();

    const options = items.map(item =>
        item.value ?? String(item.key),
    );

    return (
        <Controller
            control={control}
            name={name}
            render={({field, fieldState}) => (
                <Field>
                    <FieldLabel>{label}</FieldLabel>

                    <Combobox
                        multiple
                        autoHighlight
                        items={options}
                        value={field.value ?? []}
                        onValueChange={field.onChange}
                    >
                        <ComboboxChips
                            ref={anchor}
                            className="w-full"
                        >
                            <ComboboxValue>
                                {selectedItems => (
                                    <>
                                        {selectedItems.map(item => (
                                            <ComboboxChip key={item}>
                                                {item}
                                            </ComboboxChip>
                                        ))}

                                        <ComboboxChipsInput />
                                    </>
                                )}
                            </ComboboxValue>
                        </ComboboxChips>

                        <ComboboxContent anchor={anchor}>
                            <ComboboxEmpty>
                                Nie znaleziono.
                            </ComboboxEmpty>

                            <ComboboxList>
                                {item => (
                                    <ComboboxItem
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>

                    {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                    )}
                </Field>
            )}
        />
    );
}