/// <reference types="google-publisher-tag" />

"use client";

import {useEffect, useId} from "react";
import Script from "next/script";
declare global {
    interface Window {
        googletag: typeof googletag;
    }
}


type AdShortItemProps = {
    index: number;
    isNearby: boolean;
};

const TEST_AD_UNIT = "/6355419/Travel/Europe/France/Paris";

export default function AdShortItem({
                                        index,
                                        isNearby,
                                    }: AdShortItemProps) {
    const reactId = useId();
    const slotId = `google-ad-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    useEffect(() => {
        if (!isNearby) return;

        window.googletag =
            window.googletag ||
            ({cmd: []} as unknown as typeof googletag);

        let disposed = false;
        let slot: googletag.Slot | null = null;

        window.googletag.cmd.push(() => {
            if (disposed) return;

            slot = window.googletag.defineSlot(
                TEST_AD_UNIT,
                [300, 250],
                slotId,
            );

            if (!slot) return;

            slot.addService(window.googletag.pubads());
            window.googletag.enableServices();
            window.googletag.display(slotId);
        });

        return () => {
            disposed = true;

            window.googletag.cmd.push(() => {
                if (slot) {
                    window.googletag.destroySlots([slot]);
                }
            });
        };
    }, [isNearby, slotId]);

    return (
        <article
            data-short-index={index}
            aria-label="Reklama testowa"
            className="relative mx-auto flex h-full w-full max-w-md snap-start snap-always flex-col items-center justify-center gap-5 overflow-hidden bg-zinc-950"
        >
            <Script
                id="google-publisher-tag"
                src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
                strategy="afterInteractive"
                crossOrigin="anonymous"
            />

            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                Reklama testowa
            </span>

            <div
                id={slotId}
                style={{width: 300, height: 250}}
                className="shrink-0"
            />

            <p className="text-sm text-white/40">
                Przewiń, aby zobaczyć kolejne przepisy
            </p>
        </article>
    );
}