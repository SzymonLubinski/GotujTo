
import { RefObject, useEffect, useState } from "react"

export function useActiveShort(scrollContainerRef: RefObject<HTMLElement | null>, shortsCount: number) {
    const [activeShortIndex, setActiveShortIndex] = useState(0)

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return
        const shorts = scrollContainer.querySelectorAll<HTMLElement>("[data-short-index]")
        const observer = new IntersectionObserver(
            entries => {
                const mostVisibleShort = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((firstEntry, secondEntry) =>
                        secondEntry.intersectionRatio - firstEntry.intersectionRatio)[0]

                if (!mostVisibleShort) return
                const shortIndex = Number((mostVisibleShort.target as HTMLElement).dataset.shortIndex)
                if (Number.isNaN(shortIndex)) return
                setActiveShortIndex(shortIndex)
            },
            {
                root: scrollContainer,
                threshold: [0.5],
            },
        )
        shorts.forEach(short => observer.observe(short))
        return () => observer.disconnect()
    }, [scrollContainerRef, shortsCount])

    return activeShortIndex
}
