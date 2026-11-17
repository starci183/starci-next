"use client"

import type { AppointReviewerCardProps, AssignItemCardProps } from "@starci-next/ui"
import { useTranslations } from "next-intl"

/** The words of the teacher's reviewer forms and of what each write did. */
export interface ReviewerAdminLabels {
    readonly appoint: AppointReviewerCardProps["labels"]
    readonly assign: AssignItemCardProps["labels"]
    readonly appointed: string
    readonly ended: string
    readonly assigned: string
}

/** Resolves the words of the appointment and reassign forms. */
export const useReviewerAdminLabels = (): ReviewerAdminLabels => {
    const t = useTranslations("app.experience.queue")
    return {
        appoint: {
            title: t("appointTitle"),
            reviewerLabel: t("reviewerSubject"),
            reviewerHint: t("reviewerSubjectHint"),
            partsLabel: t("partsLabel"),
            capacityLabel: t("capacityLabel"),
            submit: t("appoint"),
        },
        assign: {
            title: t("assignTitle"),
            reviewerLabel: t("assignLabel"),
            hint: t("assignHint"),
            submit: t("assign"),
        },
        appointed: t("appointed"),
        ended: t("ended"),
        assigned: t("assigned"),
    }
}
