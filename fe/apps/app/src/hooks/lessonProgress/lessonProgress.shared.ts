import type { AttemptState } from "@/hooks/lesson"
import type {
    AttemptView,
    LessonPhase,
    LessonView,
    OutcomeServerState,
    OutcomeState,
    ProgressView,
    StudyView,
} from "@/modules/types"

/** The activities of the lesson in one phase, in reading order. */
export const phaseActivitiesOf = (lesson: LessonView, phase: LessonPhase): LessonView["sections"][number]["activities"] =>
    lesson.sections.filter((section) => section.phase === phase).flatMap((section) => section.activities)

/** The state the screen shows for an outcome, from the state the server decides: mastered is understood, needs-review is to review. */
const OUTCOME_STATE: Readonly<Record<OutcomeServerState, OutcomeState>> = {
    "not-started": "none",
    learning: "learning",
    mastered: "understood",
    "needs-review": "review",
}

/** The bar value of an outcome state. */
const valueOf = (state: OutcomeState): number => {
    if (state === "understood") return 100
    if (state === "none") return 0
    return state === "review" ? 60 : 40
}

/** The outcomes of a lesson with the state the server decides for each; not started while the progress is unknown. */
export const outcomesOf = (lesson: LessonView, progress: ProgressView | undefined): StudyView["outcomes"] =>
    lesson.outcomes.map((outcome) => {
        const server = progress?.outcomes.find((each) => each.id === outcome.id)?.state
        const state: OutcomeState = server === undefined ? "none" : (OUTCOME_STATE[server] ?? "none")
        return { id: outcome.id, text: outcome.text, value: valueOf(state), state }
    })

/** The latest graded attempts of the activities of a phase. */
const gradedOf = (
    lesson: LessonView,
    phase: LessonPhase,
    attempts: Readonly<Record<string, AttemptState>>,
): ReadonlyArray<AttemptView> =>
    phaseActivitiesOf(lesson, phase).flatMap((activity) => {
        const view = attempts[activity.id]?.view
        return view?.status === "graded" && view.result !== undefined ? [view] : []
    })

/** The level of a criterion in an attempt, or -1 when the attempt has not been graded. */
const levelAt = (attempt: AttemptView | undefined, index: number): number =>
    attempt?.result?.criteria[index]?.level ?? -1

/** The first graded attempt of a phase, if any. */
const firstGradedOf = (
    lesson: LessonView,
    phase: LessonPhase,
    attempts: Readonly<Record<string, AttemptState>>,
): AttemptView | undefined => gradedOf(lesson, phase, attempts)[0]

/** Why a criterion moved from the first answer to the last: the quote that earns the new level, or what is still missing. */
const reasonOf = (
    before: number,
    after: number,
    criterion: { readonly evidence: string; readonly missing: string } | undefined,
): StudyView["compare"][number]["reason"] => {
    if (before < 0 || after < 0) return { kind: "none", detail: "", missing: "" }
    const missing = after >= 2 ? "" : (criterion?.missing ?? "")
    if (after === before) return { kind: "same", detail: "", missing }
    return { kind: after > before ? "better" : "worse", detail: criterion?.evidence ?? "", missing }
}

/** The total of an attempt as "5/6", or empty before a grade. */
const totalOf = (attempt: AttemptView | undefined): string =>
    attempt?.result === undefined ? "" : `${attempt.result.score}/${attempt.result.maxScore}`

/** The reflection set beside the opening diagnostic, criterion by criterion, once the learner has answered either. */
export const compareOf = (
    lesson: LessonView,
    phase: LessonPhase,
    attempts: Readonly<Record<string, AttemptState>>,
): { readonly rows: StudyView["compare"]; readonly score: string } => {
    if (phase !== "reflect") return { rows: [], score: "" }
    const before = firstGradedOf(lesson, "challenge", attempts)
    const after = firstGradedOf(lesson, "reflect", attempts)
    const criteria = (before?.result ?? after?.result)?.criteria ?? []
    const totals = [totalOf(before), totalOf(after)].filter((each) => each !== "")
    return {
        rows: criteria.map((criterion, index) => {
            const level = { before: levelAt(before, index), after: levelAt(after, index) }
            return {
                id: criterion.id,
                criterion: criterion.criterion,
                ...level,
                reason: reasonOf(level.before, level.after, after?.result?.criteria[index]),
            }
        }),
        score: totals.join(" → "),
    }
}
