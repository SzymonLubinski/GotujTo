"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import VideoPlayer from "@/components/web/recipe-card/VideoPlayer";

type RecipeMediaCarouselProps = {
    name: string
    images: string[]
    isMuted: boolean
    isActive: boolean
    isNearby: boolean
    onMutedChange: (muted: boolean) => void
    videoUrl?: string | null
    priority?: boolean
}

export default function RecipeMediaCarousel({name, images, isMuted, onMutedChange, isNearby, isActive, videoUrl, priority = false}: RecipeMediaCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const mediaCount = images.length + (videoUrl ? 1 : 0)

    function handleScroll() {
        const container = containerRef.current

        if (!container || container.clientWidth === 0) {
            return
        }

        const nextIndex = Math.round(
            container.scrollLeft / container.clientWidth,
        )

        setActiveIndex(nextIndex)
    }

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef}
                 onScroll={handleScroll}
                 className="no-scrollbar flex h-full w-full snap-x snap-mandatory flex-row overflow-x-auto overscroll-x-contain"
            >
                {videoUrl && (
                    <div className="relative h-full w-full shrink-0 snap-start">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-[70%] w-full">
                                <VideoPlayer src={videoUrl}
                                             isMuted={isMuted}
                                             onMutedChange={onMutedChange}
                                             isActive={isActive}
                                             isNearby={isNearby}
                                             autoPlay
                                />
                            </div>
                        </div>
                    </div>
                )}

                {images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative h-full w-full shrink-0 snap-start">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative h-[70%] w-full">
                                <Image
                                    src={image}
                                    alt={`${name} — zdjęcie ${index + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 448px"
                                    className="object-contain"
                                    priority={
                                        priority &&
                                        !videoUrl &&
                                        index === 0
                                    }
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {mediaCount > 1 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center gap-2">
                    {Array.from({ length: mediaCount }).map((_, index) => (
                        <span key={index} className={
                                index === activeIndex
                                    ? "h-2 w-2 rounded-full bg-white"
                                    : "h-2 w-2 rounded-full bg-white/40"
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}