"use client"

import { useTranslations } from "next-intl"
import type { ApplyEvidenceLabels, ChoiceCardLabels, SimulationCardLabels, WrittenCardLabels } from "@/modules/types"

/** The words of the three kinds of activity card. */
type LessonCardLabels = {
    readonly choice: ChoiceCardLabels
    readonly written: WrittenCardLabels
    readonly simulation: SimulationCardLabels
    readonly evidence: ApplyEvidenceLabels
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
            moves: t("simulation.moves"),
            log: t("simulation.log"),
            logEmpty: t("simulation.logEmpty"),
            current: t("simulation.current"),
            tried: t("simulation.tried"),
            untried: t("simulation.untried"),
            unavailable: t("simulation.unavailable"),
            observing: t("simulation.observing"),
            succeeded: t("simulation.succeeded"),
            progress: t("simulation.progress", { tried: "{tried}", total: "{total}" }),
            back: t("simulation.back"),
            restart: t("simulation.restart"),
            noMoves: t("simulation.noMoves"),
        },
        evidence: {
            output: t("evidence.output"),
            outputHint: t("evidence.outputHint"),
            explanation: t("evidence.explanation"),
            explanationHint: t("evidence.explanationHint"),
            submit: t("evidence.submit"),
            retry: t("evidence.retry"),
            pending: t("evidence.pending"),
            saved: t("attempt.saved"),
            grading: t("attempt.grading"),
            failedSaved: t("attempt.failedSaved"),
            error: t("attempt.error"),
            premium: t("written.premium"),
            plans: t("locked.plans"),
            result: t("evidence.result"),
            levels: [t("levels.none"), t("levels.half"), t("levels.reached")],
            missing: t("evidence.missing"),
            savedAt: t("evidence.savedAt", { time: "{time}" }),
        },
    }
}
