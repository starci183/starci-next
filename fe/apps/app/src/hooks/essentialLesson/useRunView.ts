"use client"

import { useMemo } from "react"
import type { AttemptState } from "@/hooks/lesson"
import type { EssenceQuestionView } from "@starci-next/ui"
import type { EssentialChallengeView, EssentialView, LessonView } from "@/modules/types"
import { applyOf, scenariosOf, sourceOf, type RunDesk, type RunParts, type RunWords } from "@/modules/essential-runs"
import type { RunData } from "./useRunData"

/** What the three parts are drawn from. */
type RunViewInput = {
    readonly lesson: LessonView | undefined
    readonly essential: EssentialView | undefined
    readonly data: RunData
    readonly chosen: RunDesk
    /** The scenario named by the address; it stands until the learner chooses one. */
    readonly scenario: string | undefined
    readonly revealed: Readonly<Record<string, string>>
    readonly words: RunWords
    readonly attempts: Readonly<Record<string, AttemptState>>
    readonly picks: Readonly<Record<string, string>>
    readonly empty: RunParts
}

/** The essence check of a rung as the question card draws it, from the attempts of the learner (graded on the spot). */
const questionsOf = (
    rung: EssentialChallengeView,
    attempts: Readonly<Record<string, AttemptState>>,
    picks: Readonly<Record<string, string>>,
): ReadonlyArray<EssenceQuestionView> =>
    rung.questions.map((question) => {
        const attempt = attempts[question.activityId]
        const result = attempt?.view?.result
        return {
            id: question.activityId,
            prompt: question.prompt,
            choices: question.choices,
            pickedId: picks[question.activityId] ?? attempt?.view?.answer.optionId ?? "",
            correctId: result?.options.find((option) => option.isCorrect)?.optionId ?? "",
            status: attempt?.status ?? "idle",
            isSendFailed: attempt?.isSendFailed ?? false,
            isCorrect: result?.correct === true,
            explanation: result?.options.find((option) => option.selected)?.explanation ?? "",
            links: [],
            misses: [],
            isSolved: result?.correct === true,
            insight: undefined,
        }
    })

/** Builds Source, Scenarios and Apply from what was read and what the learner chose; the same parts stand while neither changes. */
export const useRunView = (input: RunViewInput): RunParts => {
    const { lesson, essential, data, chosen, scenario, revealed, words, attempts, picks, empty } = input
    return useMemo(() => {
        if (lesson === undefined || essential === undefined) return empty
        const desk = { ...chosen, scenarioId: chosen.scenarioId === "" ? (scenario ?? "") : chosen.scenarioId }
        return {
            source: sourceOf(lesson, essential, data.machine, data.runs),
            scenarios: scenariosOf({
                lesson,
                essential,
                runs: data.runs,
                desk,
                machine: data.machine,
                revealed,
                words,
            }),
            apply: applyOf({
                lesson,
                essential,
                runs: data.runs,
                scores: data.scores,
                chosen: chosen.challengeId,
                questionsOf: (rung) => questionsOf(rung, attempts, picks),
                words,
            }),
        }
    }, [
        lesson,
        essential,
        data.runs,
        data.scores,
        data.machine,
        chosen,
        scenario,
        revealed,
        words,
        attempts,
        picks,
        empty,
    ])
}
