import type { AttemptState } from "@/hooks/lesson"
import type { AttemptView, LessonPhase, LessonView, ProgressView, StudyView } from "@/modules/types"

/** The value of an outcome bar: nothing yet, understood, or proved by an attempt in the real code. */
const barOf = (progress: ProgressView["outcomes"][number] | undefined): number => {
    if (progress === undefined || progress.understood === 0) return 0
    return progress.proved > 0 ? 100 : 60
}

/** The outcome bars of a lesson from the progress the server keeps. */
export const outcomesOf = (lesson: LessonView, progress: ProgressView | undefined): StudyView["outcomes"] =>
    lesson.outcomes.map((outcome) => ({
        id: outcome.id,
        text: outcome.text,
        value: barOf(progress?.outcomes.find((each) => each.id === outcome.id)),
    }))

/** The level of a criterion in an attempt, or -1 when the attempt has not been graded. */
const levelAt = (attempt: AttemptView | undefined, index: number): number =>
    attempt?.result?.criteria[index]?.level ?? -1

/** The reflection set beside the opening diagnostic, criterion by criterion, once the learner has answered either. */
export const compareOf = (
    lesson: LessonView,
    phase: LessonPhase,
    attempts: Readonly<Record<string, AttemptState>>,
    challenge: AttemptView | undefined,
): StudyView["compare"] => {
    if (phase !== "reflect") return []
    const reflectActivities = lesson.sections
        .filter((section) => section.phase === "reflect")
        .flatMap((section) => section.activities)
    const after = reflectActivities
        .map((activity) => attempts[activity.id]?.view)
        .find((view) => view?.result !== undefined)
    const criteria = (challenge?.result ?? after?.result)?.criteria ?? []
    return criteria.map((criterion, index) => ({
        id: criterion.id,
        criterion: criterion.criterion,
        before: levelAt(challenge, index),
        after: levelAt(after, index),
    }))
}
