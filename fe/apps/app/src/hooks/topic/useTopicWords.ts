"use client"

import { useTranslations } from "next-intl"
import { useCatalogWords, useViewerPremium } from "@/hooks/catalog"
import type { TopicWords } from "@/modules/types"

/** The words the topic view is built with. */
export const useTopicWords = (): TopicWords => {
    const t = useTranslations("app.essentials")
    const isPremium = useViewerPremium()
    const catalog = useCatalogWords()
    return {
        soon: t("topic.soon"),
        pending: t("topic.pending"),
        statuses: {
            none: t("catalog.statusNone"),
            doing: t("catalog.statusDoing"),
            understood: t("catalog.statusUnderstood"),
            proved: t("catalog.statusProved"),
            free: t("catalog.statusFree"),
        },
        ctas: {
            none: t("topic.ctaStart"),
            doing: t("topic.ctaResume"),
            understood: t("topic.ctaView"),
            proved: t("topic.ctaView"),
            free: t("topic.ctaView"),
        },
        openFacts: (open, total) => t("topic.openFacts", { open, total }),
        source: (from) => t("topic.source", { from }),
        progress: (done, total) => t("topic.progress", { done, total }),
        meta: (difficulty, minutes, languages) =>
            t("topic.meta", { difficulty, minutes, languages: languages === "" ? t("topic.noLanguage") : languages }),
        facts: (lessons, minutes, languages) =>
            languages === 0 ? t("topic.factsAgnostic", { lessons, minutes }) : t("topic.facts", { lessons, minutes, languages }),
        phasesNote: (done, total) => t("topic.phasesNote", { done, total }),
        phases: catalog.phases,
        languageNames: { ...catalog.languageNames, csharp: "C#" },
        shortLanguageNames: { typescript: "TS", java: "Java", csharp: "C#", go: "Go", python: "Python" },
        difficulty: {
            foundation: t("difficulty.foundation"),
            intermediate: t("difficulty.intermediate"),
            advanced: t("difficulty.advanced"),
        },
        isPremium,
        groups: catalog.groups,
    }
}
