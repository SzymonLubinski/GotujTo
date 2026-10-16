import {redirect} from "next/navigation";

import {ProfileDashboard} from "@/components/web/profile/ProfileDashboard";
import {isAuthenticated} from "@/lib/auth-server";

export default async function ProfilePage() {
    if (!(await isAuthenticated())) {
        redirect("/login");
    }

    return <ProfileDashboard />;
}
