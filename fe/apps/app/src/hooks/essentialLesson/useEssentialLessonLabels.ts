"use client"

import { useTranslations } from "next-intl"
import type { EssentialPartsLabels } from "@starci-next/ui"
import { useLessonJourneyLabels } from "@/hooks/lessonStudy"
import type { EssentialPart } from "@/modules/types"

/** The words of the lesson page around the four parts. */
export type EssentialPageLabels = {
    readonly pageTitle: string
    readonly breadcrumbs: string
    readonly parts: Readonly<Record<EssentialPart, string>>
    readonly empty: string
    readonly errorTitle: string
    readonly errorText: string
    readonly soon: string
    readonly more: string
    readonly less: string
}

/** Every word of the four-part lesson page that is not a part's own: the page and the prose a part opens with. */
export const useEssentialLessonLabels = (): {
    readonly page: EssentialPageLabels
    readonly parts: EssentialPartsLabels
} => {
    const t = useTranslations("app.essentials.essential")
    const journey = useLessonJourneyLabels()
    return {
        page: {
            pageTitle: t("pageTitle"),
            breadcrumbs: t("breadcrumbs"),
            parts: {
                essence: t("parts.essence"),
                source: t("parts.source"),
                scenarios: t("parts.scenarios"),
                apply: t("parts.apply"),
                pattern: t("parts.pattern"),
            },
            empty: t("empty"),
            errorTitle: t("errorTitle"),
            errorText: t("errorText"),
            soon: t("soon"),
            more: t("more"),
            less: t("less"),
        },
        parts: {
            markdown: journey.markdown,
            article: { locked: t("article.locked") },
        },
    }
}
