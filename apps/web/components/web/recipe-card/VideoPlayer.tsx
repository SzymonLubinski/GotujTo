"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Volume2, VolumeX } from "lucide-react"

type VideoPlayerProps = {
    src: string
    isActive?: boolean
    isNearby?: boolean
    isMuted?: boolean
    autoPlay: boolean
    onMutedChange?: (muted: boolean) => void
}

export default function VideoPlayer({ src, isActive, isNearby, autoPlay, isMuted, onMutedChange }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [internalMuted, setInternalMuted] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const [progress, setProgress] = useState(0)

    const active = isActive ?? true
    const muted = isMuted ?? internalMuted
    const shouldPreload = isNearby ?? active

    useEffect(() => {
        const video = videoRef.current

        if (!video) return

        if (active) {
            video.play().catch(() => {})
        } else {
            video.pause()
        }
    }, [active])

    function togglePlayback() {
        const video = videoRef.current

        if (!video) return

        if (video.paused) {
            video.play().catch(() => {})
        } else {
            video.pause()
        }
    }

    function handleMutedChange() {
        const nextMuted = !muted

        if (onMutedChange) {
            onMutedChange(nextMuted)
        } else {
            setInternalMuted(nextMuted)
        }
    }

    function handleTimeUpdate() {
        const video = videoRef.current

        if (!video || !video.duration) return

        setProgress((video.currentTime / video.duration) * 100)
    }

    return (
        <div onClick={togglePlayback} className="relative h-full w-full">
            <video ref={videoRef}
                   src={src}
                   muted={muted}
                   playsInline
                   loop
                   preload={shouldPreload ? "auto" : "metadata"}
                   onPlay={() => setIsPaused(false)}
                   onPause={() => setIsPaused(true)}
                   onTimeUpdate={handleTimeUpdate}
                   className="h-full w-full object-cover"
                   autoPlay
            />

            <button type="button" onClick={event => {
                event.stopPropagation();
                handleMutedChange()
            }}
                    className="absolute right-4 top-4 z-50 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>

            {isPaused && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                        <Play className="ml-1 size-8 fill-white text-white" />
                    </div>
                </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-0.5 bg-white/20">
                <div className="h-full bg-white transition-[width] duration-75" style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}