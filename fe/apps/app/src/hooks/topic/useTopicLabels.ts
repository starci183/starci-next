"use client"

import { useTranslations } from "next-intl"
import { useViewerPremium } from "@/hooks/catalog"
import type { TopicLabels } from "@/modules/types"

/** The fixed words of the topic screen. */
export const useTopicLabels = (): TopicLabels => {
    const t = useTranslations("app.essentials")
    const isPremium = useViewerPremium()
    return {
        pageTitle: t("catalog.title"),
        breadcrumbs: t("study.breadcrumbs"),
        path: t("topic.path"),
        ringsLabel: t("topic.ringsLabel"),
        doneLabel: t("topic.doneLabel"),
        pathEmpty: t("topic.pathEmpty"),
        asideEmpty: t("catalog.asideEmpty"),
        prerequisites: t("topic.prerequisites"),
        related: t("topic.related"),
        moved: t("topic.moved"),
        movedOpen: t("topic.movedOpen"),
        upsell: isPremium ? undefined : { label: t("catalog.upsell"), note: t("topic.upsellNote") },
    }
}
