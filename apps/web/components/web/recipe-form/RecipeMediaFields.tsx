"use client"

import Image from "next/image"
import { ChangeEvent, useEffect, useRef } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { ImagePlus, Trash2, VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RecipeFormValues, RecipeImageValue, RecipeVideoValue } from "@/lib/schemas/recipe"

const MAX_IMAGES = 8

function createImageValue(file: File): RecipeImageValue {
    return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
    }
}
function createVideoValue(file: File): RecipeVideoValue {
    return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
    }
}

export default function RecipeMediaFields() {
    const { control } = useFormContext<RecipeFormValues>()
    const objectUrlsRef = useRef<Set<string>>(new Set())

    function registerObjectUrl(url: string) {
        objectUrlsRef.current.add(url)
    }

    function revokeObjectUrl(url: string) {
        if (!url.startsWith("blob:")) {
            return
        }

        URL.revokeObjectURL(url)
        objectUrlsRef.current.delete(url)
    }

    useEffect(() => {
        const objectUrls = objectUrlsRef.current

        return () => {
            objectUrls.forEach((url) => {
                URL.revokeObjectURL(url)
            })

            objectUrls.clear()
        }
    }, [])

    return (
        <section className="space-y-8">
            <Controller
                control={control}
                name="step1.images"
                render={({ field, fieldState }) => {
                    const images = field.value ?? []

                    function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
                        const selectedFiles = Array.from(event.target.files ?? [])
                        const availablePlaces = MAX_IMAGES - images.length
                        const acceptedFiles = selectedFiles.slice(0, availablePlaces)

                        if (acceptedFiles.length === 0) {
                            event.target.value = ""
                            return
                        }

                        const newImages = acceptedFiles.map((file) => {
                            const image = createImageValue(file)

                            registerObjectUrl(image.previewUrl)

                            return image
                        })

                        field.onChange([...images, ...newImages])
                        field.onBlur()

                        event.target.value = ""
                    }

                    function removeImage(imageId: string) {
                        const imageToRemove = images.find((image) => image.id === imageId)

                        if (!imageToRemove) {
                            return
                        }

                        revokeObjectUrl(imageToRemove.previewUrl)

                        field.onChange(images.filter((image) => image.id !== imageId))
                        field.onBlur()
                    }

                    return (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="recipe-images">Zdjęcia przepisu</Label>

                                    <p className="text-sm text-muted-foreground">
                                        Dodaj maksymalnie {MAX_IMAGES} zdjęć. Pierwsze zdjęcie będzie wyświetlane jako pierwsze po filmie.
                                    </p>
                                </div>

                                <span className="shrink-0 text-sm text-muted-foreground">
                                    {images.length}/{MAX_IMAGES}
                                </span>
                            </div>

                            {images.length < MAX_IMAGES && (
                                <Label htmlFor="recipe-images" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-6 transition-colors hover:bg-muted">
                                    <ImagePlus className="size-5" />
                                    Dodaj zdjęcia
                                </Label>
                            )}

                            <Input
                                id="recipe-images"
                                ref={field.ref}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleImagesChange}
                                className="sr-only"
                            />

                            {fieldState.error?.message && <p className="text-sm text-destructive">{fieldState.error.message}</p>}

                            {images.length > 0 && (
                                <div className="flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto rounded-xl bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {images.map((image, index) => (
                                        <div key={image.id} className="relative h-full min-w-full snap-center snap-always overflow-hidden">
                                            <Image
                                                src={image.previewUrl}
                                                alt={`Podgląd zdjęcia ${index + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 768px"
                                                unoptimized
                                                className="object-cover"
                                            />

                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(image.id)} className="absolute right-3 top-3 z-10 rounded-full">
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">Usuń zdjęcie {index + 1}</span>
                                            </Button>

                                            <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                                                {index + 1} / {images.length}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }}
            />

            <Controller
                control={control}
                name="step1.video"
                render={({ field, fieldState }) => {
                    function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
                        const selectedFile = event.target.files?.[0]

                        if (!selectedFile) {
                            return
                        }

                        if (field.value?.previewUrl.startsWith("blob:")) {
                            revokeObjectUrl(field.value.previewUrl)
                        }

                        const video = createVideoValue(selectedFile)

                        registerObjectUrl(video.previewUrl)

                        field.onChange(video)
                        field.onBlur()

                        event.target.value = ""
                    }

                    function removeVideo() {
                        if (!field.value) {
                            return
                        }

                        if (field.value.previewUrl.startsWith("blob:")) {
                            revokeObjectUrl(field.value.previewUrl)
                        }

                        field.onChange(undefined)
                        field.onBlur()
                    }

                    return (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="recipe-video">Film przepisu</Label>

                                <p className="text-sm text-muted-foreground">
                                    Film jest opcjonalny. Po dodaniu będzie pierwszym elementem nagłówka przepisu.
                                </p>
                            </div>

                            {!field.value && (
                                <Label htmlFor="recipe-video" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-6 transition-colors hover:bg-muted">
                                    <VideoIcon className="size-5" />
                                    Dodaj film
                                </Label>
                            )}

                            <Input
                                id="recipe-video"
                                ref={field.ref}
                                type="file"
                                accept="video/mp4,video/webm"
                                onChange={handleVideoChange}
                                className="sr-only"
                            />

                            {fieldState.error?.message && <p className="text-sm text-destructive">{fieldState.error.message}</p>}

                            {field.value && (
                                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-black">
                                    <video src={field.value.previewUrl} controls muted playsInline preload="metadata" className="h-full w-full object-cover">
                                        Twoja przeglądarka nie obsługuje odtwarzania wideo.
                                    </video>

                                    <Button type="button" variant="destructive" size="icon" onClick={removeVideo} className="absolute right-3 top-3 z-10 rounded-full">
                                        <Trash2 className="size-4" />
                                        <span className="sr-only">Usuń film</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                }}
            />
        </section>
    )
}
