import {ReactNode} from "react";

import FeedFooter from "@/components/web/feed/FeedFooter";

export default function SharedLayout({children}: { children: ReactNode }) {
    return (
        <div className="relative h-dvh overflow-hidden bg-black">
            <main className="h-full overflow-hidden">
                {children}
            </main>
            <FeedFooter/>
        </div>
    );
}