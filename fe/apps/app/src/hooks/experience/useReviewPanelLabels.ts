"use client"

import { useTranslations } from "next-intl"
import type { ReviewPanelLabels } from "@/modules/types"

/** The words of the review panel, shared by the queue and the item page. */
export const useReviewPanelLabels = (): ReviewPanelLabels => {
    const t = useTranslations("app.experience.queue")
    return {
        previewEmpty: t("previewEmpty"),
        aiLine: t("aiLine"),
        evidenceTitle: t("evidenceTitle"),
        gradeTitle: t("gradeTitle"),
        defenseTitle: t("defenseTitle"),
        noteLabel: t("noteLabel"),
        notePlaceholder: t("notePlaceholder"),
        approve: t("approve"),
        giveBack: t("return"),
        rules: t("rules"),
        historyTitle: t("historyTitle"),
        revokeLabel: t("revokeLabel"),
        revoke: t("revoke"),
    }
}
