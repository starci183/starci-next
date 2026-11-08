"use client"

import { useTranslations } from "next-intl"
import type { ReviewGrade } from "@/modules/types"

/** The translator of the review catalog. */
export type ReviewTranslator = ReturnType<typeof useTranslations<"app.review">>

/** The words of the review screens, resolved once from the catalog. */
export type ReviewWords = {
    readonly t: ReviewTranslator
    readonly level: (level: string) => string
    readonly grade: (grade: ReviewGrade) => string
    readonly interval: (days: number) => string
}

/** The words the review screens are built with. */
export const useReviewWords = (): ReviewWords => {
    const t = useTranslations("app.review")
    const levels: Readonly<Record<string, string>> = {
        junior: t("levels.junior"),
        middle: t("levels.middle"),
        senior: t("levels.senior"),
        staff: t("levels.staff"),
    }
    const gradeWords: Readonly<Record<ReviewGrade, string>> = {
        AGAIN: t("session.again"),
        HARD: t("session.hard"),
        GOOD: t("session.good"),
        EASY: t("session.easy"),
    }
    return {
        t,
        level: (level) => levels[level.toLowerCase()] ?? level,
        grade: (grade) => gradeWords[grade],
        interval: (days) => t("session.interval", { days }),
    }
}
