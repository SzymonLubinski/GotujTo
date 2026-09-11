import {useEffect} from "react";
import type {Dispatch, RefObject, SetStateAction} from "react";
import {useActiveShort} from "@/lib/hooks/useActiveShort";

type UseShortFeedProps = {
    resultsLength: number;
    limit: number;
    setLimit: Dispatch<SetStateAction<number>>;
    scrollContainerRef: RefObject<HTMLDivElement | null>;
    loadTriggerRef: RefObject<HTMLElement | null>;
    loadMoreCount: number;
    loadMore: (numItems: number) => void;
    canLoadMore?: boolean;
};

export function useShortFeed({
                                 resultsLength,
                                 limit,
                                 setLimit,
                                 scrollContainerRef,
                                 loadTriggerRef,
                                 loadMoreCount,
                                 loadMore,
                                 canLoadMore,
                             }: UseShortFeedProps) {
    const hasMore = canLoadMore ?? resultsLength === limit;
    const activeShortIndex = useActiveShort(
        scrollContainerRef,
        resultsLength,
    );

    useEffect(() => {
        const container = scrollContainerRef.current;
        const trigger = loadTriggerRef.current;

        if (!container || !trigger || !hasMore) return;

        let triggered = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting || triggered) return;

                triggered = true;
                observer.disconnect();

                setLimit(current => current + loadMoreCount);
                loadMore(loadMoreCount);
            },
            {
                root: container,
                threshold: 0.5,
            },
        );

        observer.observe(trigger);

        return () => observer.disconnect();
    }, [
        hasMore,
        resultsLength,
        loadMoreCount,
        loadMore,
        scrollContainerRef,
        loadTriggerRef,
        setLimit,
    ]);

    return {activeShortIndex, hasMore};
}