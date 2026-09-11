import {FieldPath, FieldValues, useController, useFormContext} from "react-hook-form";
import {ControllerProps} from "@/lib/types/controllers";
import {Field, FieldError} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {useEffect, useState} from "react";
import {Doc} from "@gotujto/convex/_generated/dataModel";

type ProductInputControllerProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>
> = ControllerProps<TFieldValues, TName> & {
    initialProductName?: string;
    onProductNameChange?: (productName: string) => void;
}

export default function ProductInputController<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>
>({name, label, placeholder, initialProductName, onProductNameChange}: ProductInputControllerProps<TFieldValues, TName>) {
    const {control} = useFormContext<TFieldValues>();
    const [phrase, setPhrase] = useState<string>("")
    const [openSuggestionList, setOpenSuggestionList] = useState<boolean>(false);
    const {field, fieldState} = useController({name, control})

    useEffect(() => {
        setPhrase(initialProductName ?? "")
    }, [initialProductName])

    const products = useQuery(
        api.products.searchProducts,
        phrase.trim().length >= 2 ? {phrase} : 'skip'
    )

    function handleSelectProduct(product: Doc<"products">) {
        setPhrase(product.name)
        field.onChange(product._id)
        setOpenSuggestionList(false)
        if (onProductNameChange){
            onProductNameChange(product.name)
        }
    }

    // const ingredientWatch = useWatch({control, name})
    // useEffect(() => {
    //     console.log('phrase:', phrase)
    // }, [phrase]);

    return (
        <Field className="relative">
            <Input
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                placeholder={placeholder}
                aria-label={label}
                aria-invalid={fieldState.invalid}
                value={phrase}
                onChange={(event) => {
                    setOpenSuggestionList(true);
                    setPhrase(event.target.value);
                    field.onChange(undefined);
                    onProductNameChange?.(event.target.value);
                }}
            />
                {products && openSuggestionList && (
                    <div className="absolute bottom-0 left-0 translate-y-full bg-stone-900 p-2 rounded-lg">
                        <div className="flex flex-col">
                            <h2 className="text-center text-lg">Wybierz produkt:</h2>
                            {products.map((product) => (
                                <button key={product._id}
                                        type="button"
                                        className="bg-stone-700 m-1"
                                        onClick={() => handleSelectProduct(product)}
                                >
                                    {product.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]}/>
                )}
        </Field>
    )
}
