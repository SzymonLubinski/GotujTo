"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import VideoPlayer from "@/components/web/recipe-card/VideoPlayer";
import { cn } from "@/lib/utils"

type RecipeHeaderProps = {
    title: string
    images: string[]
    videoUrl?: string
}

export function RecipeHeader({title, images, videoUrl,}: RecipeHeaderProps) {
    const carouselRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const mediaCount = images.length + (videoUrl ? 1 : 0)

    function handleScroll() {
        const carousel = carouselRef.current
        if (!carousel || carousel.clientWidth === 0) {
            return
        }
        const nextIndex = Math.round(
            carousel.scrollLeft / carousel.clientWidth,
        )
        setActiveIndex(nextIndex)
    }

    return (
        <header className="relative overflow-hidden bg-black lg:rounded-2xl">
            <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth lg:aspect-auto lg:h-[450px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {videoUrl && (
                    <div className="h-full min-w-full snap-center snap-always">
                        <VideoPlayer src={videoUrl} autoPlay={false}/>
                    </div>
                )}

                {images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative h-full min-w-full snap-center snap-always">
                        <Image src={image} alt={`${title} — zdjęcie ${index + 1}`} fill sizes="(min-width: 1152px) 488px, (min-width: 1024px) 45vw, (min-width: 768px) 768px, 100vw" priority={!videoUrl && index === 0} className="object-cover" />
                    </div>
                ))}
            </div>

            {mediaCount > 1 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                    <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm">
                        {Array.from({ length: mediaCount }, (_, index) => (
                            <span key={index} className={cn("size-1.5 rounded-full bg-white/50 transition-all", activeIndex === index && "w-5 bg-white")} />
                        ))}
                    </div>
                </div>
            )}
        </header>
    )
}