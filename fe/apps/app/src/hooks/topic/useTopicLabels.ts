"use client"

import { useTranslations } from "next-intl"
import type { TopicLabels } from "@/modules/types"

/** The fixed words of the topic screen. */
export const useTopicLabels = (): TopicLabels => {
    const t = useTranslations("app.essentials.topic")
    return {
        pageTitle: t("pageTitle"),
        breadcrumbs: t("breadcrumbs"),
        list: t("list"),
        empty: t("pathEmpty"),
        partsTitle: t("partsTitle"),
        partsNote: t("partsNote"),
        prerequisites: t("prerequisites"),
        related: t("related"),
        moved: t("moved"),
        movedOpen: t("movedOpen"),
        trackTitle: t("trackTitle"),
        trackLabel: t("trackLabel"),
        trackState: { done: t("trackDone"), doing: t("trackDoing"), todo: t("trackTodo") },
        lessonsTitle: t("lessonsTitle"),
    }
}
