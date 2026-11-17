import type { AttemptState } from "@/hooks/lesson"
import { phaseActivitiesOf } from "@/hooks/lessonProgress"
import { lessonPath, topicPath } from "@/modules/routes"
import type {
    LessonPhase,
    LessonView,
    NavTarget,
    PhaseResultView,
    SectionCheckView,
    ProgressView,
    SectionView,
    StepView,
    StudyView,
} from "@/modules/types"

/** The six phases a learner works through, in order. */
export const STEP_PHASES: ReadonlyArray<LessonPhase> = [
    "challenge",
    "predict",
    "explore",
    "explain",
    "apply",
    "reflect",
]

/** The attempts of the learner by activity id. */
type Attempts = Readonly<Record<string, AttemptState>>

/** The state of one step: the current one, a done one, or a later one. */
const stepStateOf = (isCurrent: boolean, isDone: boolean): StepView["state"] => {
    if (isCurrent) return "current"
    return isDone ? "done" : "later"
}

/** The six steps of the stepper: done when the server says the phase is done, current, or later. */
export const stepperOf = (
    lesson: LessonView,
    phase: LessonPhase,
    progress: ProgressView | undefined,
    isLocked: (phase: LessonPhase) => boolean,
): ReadonlyArray<StepView> =>
    STEP_PHASES.map((each) => ({
        phase: each,
        href: lessonPath(lesson.topic.id, lesson.id, each),
        state: stepStateOf(each === phase, progress?.phases.find((row) => row.phase === each)?.state === "done"),
        isLocked: isLocked(each),
    }))

/** The status of a phase for the aside: what the learner sent and how it was graded. */
const phaseStatusOf = (lesson: LessonView, phase: LessonPhase, attempts: Attempts): PhaseResultView => {
    const views = phaseActivitiesOf(lesson, phase).flatMap((activity) => {
        const view = attempts[activity.id]?.view
        return view === undefined ? [] : [view]
    })
    const graded = views.filter((view) => view.status === "graded" && view.result !== undefined)
    const first = graded[0]?.result
    if (first === undefined) return { phase, status: views.length === 0 ? "none" : "saved", scoreLine: "" }
    if (first.correct !== undefined) return { phase, status: first.correct ? "correct" : "wrong", scoreLine: "" }
    const score = graded.reduce((sum, view) => sum + (view.result?.score ?? 0), 0)
    const max = graded.reduce((sum, view) => sum + (view.result?.maxScore ?? 0), 0)
    return { phase, status: "graded", scoreLine: `${score}/${max}` }
}

/** The result of each phase the learner has begun, for the aside; the theory phase is told by its checks instead. */
export const phaseResultsOf = (lesson: LessonView, attempts: Attempts): ReadonlyArray<PhaseResultView> =>
    STEP_PHASES.filter((phase) => phase !== "explain")
        .map((phase) => phaseStatusOf(lesson, phase, attempts))
        .filter((result) => result.status !== "none")

/** The status of a quick check from whether the learner's answer was right; none before an answer. */
const checkStatusOf = (isCorrect: boolean | undefined): SectionCheckView["status"] => {
    if (isCorrect === undefined) return "none"
    return isCorrect ? "correct" : "wrong"
}

/** The quick check of each theory section: not answered, right or wrong. */
export const sectionChecksOf = (
    sections: ReadonlyArray<SectionView>,
    attempts: Attempts,
): ReadonlyArray<SectionCheckView> =>
    sections.map((section, index) => {
        const result = section.activities.flatMap((activity) => {
            const view = attempts[activity.id]?.view
            return activity.kind === "choice" && view?.result?.correct !== undefined ? [view.result.correct] : []
        })[0]
        return { id: section.id, index: index + 1, status: checkStatusOf(result) }
    })

/** The phase before and after another in the lesson, the overview before the first. */
const PHASE_ORDER: ReadonlyArray<LessonPhase> = ["overview", ...STEP_PHASES]

/** Where the previous and next controls of the page lead: the section around the open one in a theory phase, else the phase around it. */
export const navOf = (
    lesson: LessonView,
    phase: LessonPhase,
    sections: ReadonlyArray<SectionView>,
    openSectionId: string,
): { readonly previous: NavTarget | undefined; readonly next: NavTarget | undefined } => {
    const index = PHASE_ORDER.indexOf(phase)
    if (index < 1) return { previous: undefined, next: undefined }
    const phaseTarget = (target: LessonPhase | undefined): NavTarget | undefined =>
        target === undefined
            ? undefined
            : { kind: "phase", phase: target, href: lessonPath(lesson.topic.id, lesson.id, target) }
    const previousPhase = phaseTarget(PHASE_ORDER[index - 1])
    const nextName = PHASE_ORDER[index + 1]
    const nextPhase: NavTarget | undefined =
        nextName === undefined ? { kind: "lesson", href: topicPath(lesson.topic.id) } : phaseTarget(nextName)
    const position = sections.findIndex((section) => section.id === openSectionId)
    if (sections.length < 2 || position < 0) return { previous: previousPhase, next: nextPhase }
    const before = sections[position - 1]
    const after = sections[position + 1]
    return {
        previous:
            before === undefined
                ? previousPhase
                : { kind: "section", id: before.id, index: position, title: before.title },
        next:
            after === undefined
                ? nextPhase
                : { kind: "section", id: after.id, index: position + 2, title: after.title },
    }
}

/** The reviews a completion opens, one per delay: the earliest due date of that delay and whether every review of it is done; empty before the completion. */
export const reviewsOf = (progress: ProgressView | undefined): StudyView["reviews"] =>
    [...new Set((progress?.reviews ?? []).map((review) => review.afterDays))]
        .toSorted((a, b) => a - b)
        .map((days) => {
            const rows = (progress?.reviews ?? []).filter((review) => review.afterDays === days)
            return {
                days,
                dueAt: rows.map((row) => row.dueOn).toSorted((a, b) => a.localeCompare(b))[0] ?? "",
                isDone: rows.every((row) => row.done),
            }
        })
