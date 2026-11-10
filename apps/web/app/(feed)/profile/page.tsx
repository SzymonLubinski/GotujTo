import {redirect} from "next/navigation";

import {ProfileDashboard} from "@/components/web/profile/ProfileDashboard";
import {fetchAuthQuery, isAuthenticated} from "@/lib/auth-server";
import {api} from "@gotujto/convex/_generated/api";

export default async function ProfilePage() {
    if (!(await isAuthenticated())) {
        redirect("/login");
    }

    if (!(await fetchAuthQuery(api.legal.hasAcceptedTerms, {}))) {
        redirect("/accept-terms?next=/profile");
    }

    return <ProfileDashboard />;
}
