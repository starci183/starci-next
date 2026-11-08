"use client"

import { useTranslations } from "next-intl"
import type { PracticeWords } from "./practice.shared"

/** The words the pattern and problem lists are built with. */
export const usePracticeListWords = (): PracticeWords => {
    const t = useTranslations("app.practice")
    const difficulties: Readonly<Record<string, string>> = {
        easy: t("difficulty.easy"),
        medium: t("difficulty.medium"),
        hard: t("difficulty.hard"),
    }
    return {
        open: t("words.open"),
        solve: t("words.solve"),
        premium: t("words.premium"),
        statuses: {
            UNSOLVED: t("status.unsolved"),
            ATTEMPTED: t("status.attempted"),
            ACCEPTED: t("status.accepted"),
        },
        progress: (accepted, total) => t("words.progress", { accepted, total }),
        difficulty: (difficulty) => difficulties[difficulty.toLowerCase()] ?? difficulty,
    }
}
