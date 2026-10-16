"use client";

import {Controller, useFormContext} from "react-hook-form";

import type {RecipeFormValues} from "@/lib/schemas/recipe";
import {
    MediaUploadFields,
    type MediaImageValue,
    type MediaVideoValue,
} from "@/components/web/media/MediaUploadFields";

export default function RecipeMediaFields() {
    const {control} = useFormContext<RecipeFormValues>();

    return <Controller
        control={control}
        name="step1.images"
        render={({field: imageField, fieldState: imageFieldState}) => <Controller
            control={control}
            name="step1.video"
            render={({field: videoField, fieldState: videoFieldState}) => <MediaUploadFields
                contentLabel="przepisu"
                idPrefix="recipe"
                maxImages={8}
                images={imageField.value as MediaImageValue[]}
                video={videoField.value as MediaVideoValue | undefined}
                onImagesChange={images => {
                    imageField.onChange(images);
                    imageField.onBlur();
                }}
                onVideoChange={video => {
                    videoField.onChange(video);
                    videoField.onBlur();
                }}
                imageError={imageFieldState.error?.message}
                videoError={videoFieldState.error?.message}
            />}
        />}
    />;
}
