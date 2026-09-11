import {ReactNode} from "react";
import DashboardNavbar from "@/components/web/dashboard/DashboardNavbar";

export default function DashboardLayout({children}: { children: ReactNode }) {
    return (
        <div>
            <DashboardNavbar/>
            {children}
        </div>
    );
}