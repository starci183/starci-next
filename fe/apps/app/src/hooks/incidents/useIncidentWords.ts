"use client"

import { useTranslations } from "next-intl"
import type { IncidentWords } from "./incidents.shared"

/** Resolves the words the incident list is drawn with: the status badges, the action and the difficulty line of a lesson. */
export const useIncidentWords = (): IncidentWords => {
    const t = useTranslations("app.incidents")
    const lessons = useTranslations("app.essentials")
    return {
        soon: t("soon"),
        open: t("open"),
        cta: t("cta"),
        difficulty: {
            foundation: lessons("difficulty.foundation"),
            intermediate: lessons("difficulty.intermediate"),
            advanced: lessons("difficulty.advanced"),
        },
        meta: (difficulty, minutes) => t("meta", { difficulty, minutes }),
    }
}
