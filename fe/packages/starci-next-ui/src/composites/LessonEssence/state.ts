import type { EssenceBarPart, EssenceQuestionView } from "./types"

/**
 * Where one option card stands: `open` to pick; `busy` while a pick is being graded (nothing can be pressed); `wrong` a pick graded
 * wrong, locked with its reason; `right` the right pick with its reason; `reason` an option the learner never picked, shown with its
 * reason once the question is solved.
 */
export type OptionCardState = "open" | "busy" | "wrong" | "right" | "reason"

/** One option card as drawn: its letter key, its words, where it stands and the reason it carries (empty before one is released). */
export type OptionCard = {
    readonly id: string
    /** The letter the card is keyed by: A, B, C, D. */
    readonly key: string
    readonly label: string
    readonly state: OptionCardState
    readonly reason: string
}

/** The letter key of the option at `index`: A for the first. */
export const optionKeyOf = (index: number): string => String.fromCodePoint(65 + index)

/** True while a pick of the question is on its way to the grader or being graded. */
export const isGrading = (question: EssenceQuestionView): boolean =>
    question.status === "pending" || question.status === "grading"

/** Where one option stands, from the grades the question has: a wrong pick is locked for good, the right one solves the question. */
const stateOf = (question: EssenceQuestionView, optionId: string): OptionCardState => {
    const isMissed = question.misses.some((miss) => miss.optionId === optionId)
    if (question.isSolved) {
        if (optionId === question.correctId) return "right"
        return isMissed ? "wrong" : "reason"
    }
    if (isMissed) return "wrong"
    return isGrading(question) ? "busy" : "open"
}

/** The option cards of a question, in the order of its choices. */
export const optionCardsOf = (question: EssenceQuestionView): ReadonlyArray<OptionCard> =>
    question.choices.map((choice, index) => {
        const state = stateOf(question, choice.id)
        const reason =
            question.reasons.find((each) => each.optionId === choice.id)?.explanation ??
            question.misses.find((each) => each.optionId === choice.id)?.explanation ??
            ""
        return {
            id: choice.id,
            key: optionKeyOf(index),
            label: choice.label,
            state,
            reason: state === "open" ? "" : reason,
        }
    })

/** The learner moves on only once the question is solved: the next command waits for the right pick. */
export const canMoveOn = (question: EssenceQuestionView): boolean => question.isSolved

/** Where one moment of the story stands on the timeline: done once its question is solved, the question on screen current. */
export const timelineStateOf = (part: EssenceBarPart): "complete" | "current" | "upcoming" => {
    if (part.isCurrent) return "current"
    return part.tone === "neutral" ? "upcoming" : "complete"
}
