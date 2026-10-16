import Link from "next/link";
import {Check, Clock, X} from "lucide-react";

import {Button} from "@/components/ui/button";

export const submissionStatuses = [
    {value: "pending", label: "Oczekujące", icon: Clock},
    {value: "approved", label: "Zatwierdzone", icon: Check},
    {value: "rejected", label: "Odrzucone", icon: X},
] as const;

export type SubmissionStatus = typeof submissionStatuses[number]["value"];

export function getSubmissionStatus(value: string | string[] | undefined): SubmissionStatus {
    const rawValue = Array.isArray(value) ? value[0] : value;

    return submissionStatuses.find(item => item.value === rawValue)?.value ?? "pending";
}

type SubmissionStatusTabsProps = {
    basePath: string;
    status: SubmissionStatus;
    ariaLabel: string;
};

export function SubmissionStatusTabs({basePath, status, ariaLabel}: SubmissionStatusTabsProps) {
    return <nav aria-label={ariaLabel} className="mb-6 flex flex-wrap gap-2">
        {submissionStatuses.map(item => {
            const Icon = item.icon;
            const isActive = item.value === status;

            return <Button asChild key={item.value} variant={isActive ? "default" : "outline"}>
                <Link href={`${basePath}?status=${item.value}`}>
                    <Icon className="size-4" />
                    {item.label}
                </Link>
            </Button>;
        })}
    </nav>;
}
