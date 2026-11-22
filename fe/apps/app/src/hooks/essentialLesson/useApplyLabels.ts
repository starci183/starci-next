"use client"

import { useTranslations } from "next-intl"
import type { ApplyLabels } from "@starci-next/ui"
import { useLessonJourneyLabels } from "@/hooks/lessonStudy"

/** The words of the Apply part. */
export const useApplyLabels = (): ApplyLabels => {
    const t = useTranslations("app.essentials.essential.apply")
    const journey = useLessonJourneyLabels()
    return {
        markdown: journey.markdown,
        ladder: t("ladder"),
        current: t("current"),
        critical: t("critical"),
        rubric: t("rubric"),
        empty: t("empty"),
        essence: t("essence"),
        proof: t("proof"),
        proofSteps: [
            t("proofSteps.run"),
            t("proofSteps.push"),
            t("proofSteps.ci"),
            t("proofSteps.oidc"),
            t("proofSteps.proved"),
        ],
        proofNote: t("proofNote"),
    }
}
