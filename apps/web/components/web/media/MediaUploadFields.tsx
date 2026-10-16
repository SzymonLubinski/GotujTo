"use client";

import Image from "next/image";
import {useEffect, useRef, useState, type ChangeEvent} from "react";
import {ImagePlus, Trash2, VideoIcon} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);

export type MediaImageValue = {
    id: string;
    previewUrl: string;
    file?: File;
};

export type MediaVideoValue = {
    id: string;
    previewUrl: string;
    file?: File;
};

type MediaUploadFieldsProps = {
    contentLabel: string;
    idPrefix: string;
    images: MediaImageValue[];
    video?: MediaVideoValue;
    onImagesChange: (images: MediaImageValue[]) => void;
    onVideoChange: (video: MediaVideoValue | undefined) => void;
    maxImages: number;
    imageError?: string;
    videoError?: string;
};

export function MediaUploadFields({
    contentLabel,
    idPrefix,
    images,
    video,
    onImagesChange,
    onVideoChange,
    maxImages,
    imageError,
    videoError,
}: MediaUploadFieldsProps) {
    const objectUrlsRef = useRef(new Set<string>());
    const [imageLocalError, setImageLocalError] = useState<string | null>(null);
    const [videoLocalError, setVideoLocalError] = useState<string | null>(null);
    const imageInputId = `${idPrefix}-images`;
    const videoInputId = `${idPrefix}-video`;

    function rememberObjectUrl(url: string) {
        if (url.startsWith("blob:")) {
            objectUrlsRef.current.add(url);
        }
    }

    function revokeObjectUrl(url: string) {
        if (!url.startsWith("blob:")) {
            return;
        }

        URL.revokeObjectURL(url);
        objectUrlsRef.current.delete(url);
    }

    useEffect(() => {
        const activeUrls = new Set(
            [...images, ...(video ? [video] : [])]
                .map(item => item.previewUrl)
                .filter(url => url.startsWith("blob:")),
        );

        objectUrlsRef.current.forEach(url => {
            if (!activeUrls.has(url)) {
                revokeObjectUrl(url);
            }
        });
    }, [images, video]);

    useEffect(() => {
        const objectUrls = objectUrlsRef.current;

        return () => {
            objectUrls.forEach(url => URL.revokeObjectURL(url));
            objectUrls.clear();
        };
    }, []);

    function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(event.target.files ?? []);
        event.target.value = "";

        if (selectedFiles.length === 0) {
            return;
        }

        if (images.length + selectedFiles.length > maxImages) {
            setImageLocalError(`Mozesz dodac maksymalnie ${maxImages} zdjec.`);
            return;
        }

        const invalidFile = selectedFiles.find(file => !allowedImageTypes.has(file.type) || file.size > MAX_IMAGE_SIZE);

        if (invalidFile) {
            setImageLocalError("Dodaj zdjecia JPG, PNG lub WebP o rozmiarze do 10 MB.");
            return;
        }

        const newImages = selectedFiles.map(file => {
            const previewUrl = URL.createObjectURL(file);
            rememberObjectUrl(previewUrl);

            return {id: crypto.randomUUID(), file, previewUrl} satisfies MediaImageValue;
        });

        setImageLocalError(null);
        onImagesChange([...images, ...newImages]);
    }

    function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        if (!allowedVideoTypes.has(file.type) || file.size > MAX_VIDEO_SIZE) {
            setVideoLocalError("Dodaj film MP4 lub WebM o rozmiarze do 200 MB.");
            return;
        }

        if (video) {
            revokeObjectUrl(video.previewUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        rememberObjectUrl(previewUrl);
        setVideoLocalError(null);
        onVideoChange({id: crypto.randomUUID(), file, previewUrl});
    }

    function removeImage(imageId: string) {
        const image = images.find(item => item.id === imageId);

        if (image) {
            revokeObjectUrl(image.previewUrl);
        }

        onImagesChange(images.filter(item => item.id !== imageId));
    }

    function removeVideo() {
        if (video) {
            revokeObjectUrl(video.previewUrl);
        }

        onVideoChange(undefined);
    }

    return <section className="space-y-8">
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <Label htmlFor={imageInputId}>Zdjecia {contentLabel}</Label>
                    <p className="text-sm text-muted-foreground">Dodaj maksymalnie {maxImages} zdjec. Film, jesli go dodasz, bedzie zawsze pierwszy.</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{images.length}/{maxImages}</span>
            </div>

            {images.length < maxImages && <Label htmlFor={imageInputId} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-6 transition-colors hover:bg-muted"><ImagePlus className="size-5" />Dodaj zdjecia</Label>}
            <Input id={imageInputId} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImagesChange} className="sr-only" />
            {(imageLocalError || imageError) && <p role="alert" className="text-sm text-destructive">{imageLocalError ?? imageError}</p>}

            {images.length > 0 && <div className="flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto rounded-xl bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((image, index) => <div key={image.id} className="relative h-full min-w-full snap-center snap-always overflow-hidden">
                    <Image src={image.previewUrl} alt={`Podglad zdjecia ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 768px" unoptimized={image.previewUrl.startsWith("blob:")} className="object-cover" />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(image.id)} className="absolute right-3 top-3 z-10 rounded-full"><Trash2 className="size-4" /><span className="sr-only">Usun zdjecie {index + 1}</span></Button>
                    <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">{index + 1} / {images.length}</div>
                </div>)}
            </div>}
        </div>

        <div className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor={videoInputId}>Film {contentLabel} (opcjonalnie)</Label>
                <p className="text-sm text-muted-foreground">MP4 lub WebM, maksymalnie 200 MB. Mozesz dodac jeden film.</p>
            </div>

            {!video && <Label htmlFor={videoInputId} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-6 transition-colors hover:bg-muted"><VideoIcon className="size-5" />Dodaj film</Label>}
            <Input id={videoInputId} type="file" accept="video/mp4,video/webm" onChange={handleVideoChange} className="sr-only" />
            {(videoLocalError || videoError) && <p role="alert" className="text-sm text-destructive">{videoLocalError ?? videoError}</p>}

            {video && <div className="relative overflow-hidden rounded-xl bg-black">
                <video src={video.previewUrl} controls muted playsInline preload="metadata" className="aspect-video w-full object-cover">Twoja przegladarka nie obsluguje odtwarzania wideo.</video>
                <Button type="button" variant="destructive" size="icon" onClick={removeVideo} className="absolute right-3 top-3 z-10 rounded-full"><Trash2 className="size-4" /><span className="sr-only">Usun film</span></Button>
            </div>}
        </div>
    </section>;
}
