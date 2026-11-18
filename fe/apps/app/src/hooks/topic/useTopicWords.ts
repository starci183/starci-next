"use client"

import { useTranslations } from "next-intl"
import type { TopicWords } from "@/modules/types"

/** The words the topic view is built with. */
export const useTopicWords = (): TopicWords => {
    const t = useTranslations("app.essentials.topic")
    return {
        facts: (lessons, minutes) => t("facts", { lessons, minutes }),
        progress: (done, total) => t("progress", { done, total }),
        startFirst: t("startFirst"),
        resumePart: (part) => t("resumePart", { part }),
        resume: (title, part) => t("resume", { title, part }),
        notice: { title: t("noticeTitle"), text: t("noticeText") },
        parts: [
            { id: "essence", title: t("parts.essence"), isFree: true },
            { id: "source", title: t("parts.source"), isFree: false },
            { id: "scenarios", title: t("parts.scenarios"), isFree: false },
            { id: "apply", title: t("parts.apply"), isFree: false },
        ],
    }
}
