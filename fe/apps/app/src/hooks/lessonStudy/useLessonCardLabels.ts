"use client"

import { useTranslations } from "next-intl"
import type { ChoiceCardLabels, SimulationCardLabels, WrittenCardLabels } from "@/modules/types"

/** The words of the three kinds of activity card. */
type LessonCardLabels = {
    readonly choice: ChoiceCardLabels
    readonly written: WrittenCardLabels
    readonly simulation: SimulationCardLabels
}

/** Resolves the words of the choice, written-answer and simulation cards. */
export const useLessonCardLabels = (): LessonCardLabels => {
    const t = useTranslations("app.essentials")
    return {
        choice: {
            submit: t("choice.submit"),
            retry: t("choice.retry"),
            pending: t("choice.pending"),
            correct: t("choice.correct"),
            incorrect: t("choice.incorrect"),
            saved: t("attempt.saved"),
            grading: t("attempt.grading"),
            failedSaved: t("attempt.failedSaved"),
            error: t("attempt.error"),
            premium: t("choice.premium"),
            plans: t("locked.plans"),
        },
        written: {
            answer: t("written.answer"),
            submit: t("written.submit"),
            retry: t("written.retry"),
            pending: t("written.pending"),
            diagnostic: t("written.diagnostic"),
            criteria: t("written.criteria"),
            saved: t("attempt.saved"),
            grading: t("attempt.grading"),
            failedSaved: t("attempt.failedSaved"),
            failedUnconfigured: t("attempt.failedUnconfigured"),
            failedLimit: t("attempt.failedLimit"),
            error: t("attempt.error"),
            premium: t("written.premium"),
            plans: t("locked.plans"),
            levels: [t("levels.none"), t("levels.half"), t("levels.reached")],
            evidence: t("written.evidence"),
        },
        simulation: {
            states: t("simulation.states"),
            current: t("simulation.current"),
            seen: t("simulation.seen"),
            ahead: t("simulation.ahead"),
            observing: t("simulation.observing"),
            succeeded: t("simulation.succeeded"),
            noMoves: t("simulation.noMoves"),
            restart: t("simulation.restart"),
        },
    }
}
