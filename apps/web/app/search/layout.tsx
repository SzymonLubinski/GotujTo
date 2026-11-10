import type { ReactNode } from "react"
import FeedFooter from "@/components/web/feed/FeedFooter"

export default function SearchLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative h-dvh overflow-hidden bg-black">
            {children}
            <FeedFooter />
        </div>
    )
}
