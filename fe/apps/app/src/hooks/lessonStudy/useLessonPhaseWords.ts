"use client"

import { useTranslations } from "next-intl"
import type { PhaseWords, LessonPhase } from "@/modules/types"

/** The words of one phase from the three keys of its catalog entry. */
const wordsOf = (title: string, sub: string, lead: string): PhaseWords => ({ title, sub, lead })

/** Resolves the name, the rail line and the opening sentence of every phase of a lesson. */
export const useLessonPhaseWords = (): Readonly<Record<LessonPhase, PhaseWords>> => {
    const t = useTranslations("app.essentials.phases")
    return {
        overview: wordsOf(t("overview.title"), t("overview.sub"), t("overview.lead")),
        challenge: wordsOf(t("challenge.title"), t("challenge.sub"), t("challenge.lead")),
        predict: wordsOf(t("predict.title"), t("predict.sub"), t("predict.lead")),
        explore: wordsOf(t("explore.title"), t("explore.sub"), t("explore.lead")),
        explain: wordsOf(t("explain.title"), t("explain.sub"), t("explain.lead")),
        apply: wordsOf(t("apply.title"), t("apply.sub"), t("apply.lead")),
        reflect: wordsOf(t("reflect.title"), t("reflect.sub"), t("reflect.lead")),
        review: wordsOf(t("review.title"), t("review.sub"), t("review.lead")),
    }
}
