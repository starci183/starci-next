import { movesFrom, stateOf, type AttemptState, type LessonWorkbench } from "@/hooks/lesson"
import type {
    ActivityView,
    AttemptStatus,
    SectionView,
    SimulationView,
    StudyCardView,
    StudyWords,
    WrittenDraftView,
} from "@/modules/types"

/** The status an activity shows: its attempt's, or idle before the first submit. */
const statusOf = (attempt: AttemptState | undefined): AttemptStatus => attempt?.status ?? "idle"

/** Why a grading failed, in the kinds the screen words: no AI provider is configured, the daily allowance is used up, or anything else. */
const issueOf = (attempt: AttemptState | undefined): WrittenDraftView["issue"] => {
    const code = attempt?.view?.failureCode ?? ""
    if (code === "") return "none"
    if (code === "ATTEMPT_COACH_UNCONFIGURED") return "unconfigured"
    return code === "ATTEMPT_COACH_LIMIT_REACHED" ? "limit" : "other"
}

/** The written draft of an activity: the text held, where its attempt stands and the grade once the server gave one. */
const draftOf = (activityId: string, workbench: LessonWorkbench, words: StudyWords): WrittenDraftView => {
    const attempt = workbench.attempts[activityId]
    const result = attempt?.view?.result
    return {
        value: workbench.answers[activityId] ?? "",
        status: statusOf(attempt),
        issue: issueOf(attempt),
        criteria: result?.criteria ?? [],
        scoreLine:
            result === undefined || result.criteria.length === 0 ? "" : words.score(result.score, result.maxScore),
        isDiagnostic: result?.isDiagnostic ?? false,
    }
}

/** The explanations a graded choice released, keyed by option id; empty before the grade. */
const explanationsOf = (attempt: AttemptState | undefined): Readonly<Record<string, string>> =>
    Object.fromEntries((attempt?.view?.result?.options ?? []).map((option) => [option.optionId, option.explanation]))

/** The choice card of a choice activity. */
const choiceCardOf = (activity: ActivityView, workbench: LessonWorkbench): StudyCardView => {
    const attempt = workbench.attempts[activity.id]
    return {
        kind: "choice",
        id: activity.id,
        prompt: activity.prompt,
        options: activity.options,
        pickedId: workbench.picks[activity.id] ?? "",
        status: statusOf(attempt),
        isCorrect: attempt?.view?.result?.correct === true,
        explanations: explanationsOf(attempt),
    }
}

/** The mark of a state in the row of states, from the trail the learner walked. */
const markOf = (stateId: string, trail: ReadonlyArray<string>): "current" | "seen" | "ahead" => {
    if (stateId === trail.at(-1)) return "current"
    return trail.includes(stateId) ? "seen" : "ahead"
}

/** The simulation card of a simulation activity, run from the public projection of its state machine. */
const simulationCardOf = (
    activity: ActivityView,
    simulation: SimulationView,
    workbench: LessonWorkbench,
    words: StudyWords,
): StudyCardView => {
    const walked = workbench.trails[activity.id] ?? []
    const trail = walked.length === 0 ? [simulation.initialStateId] : walked
    const current = stateOf(simulation, trail.at(-1) ?? simulation.initialStateId)
    return {
        kind: "simulation",
        id: activity.id,
        prompt: activity.prompt,
        steps: simulation.states.map((state) => ({ id: state.id, label: state.label, mark: markOf(state.id, trail) })),
        currentLabel: current?.label ?? "",
        observation: current?.observation ?? "",
        isSuccess: current?.isSuccess ?? false,
        moves: movesFrom(simulation, current?.id ?? simulation.initialStateId).map((move) => ({
            id: move.actionId,
            label: move.label,
            toStateId: move.toStateId,
        })),
        initialStateId: simulation.initialStateId,
        debrief: simulation.debriefQuestion,
        draft: draftOf(activity.id, workbench, words),
    }
}

/** The cards of one activity: the card of its kind, then the files an exercise hands over. */
const activityCardsOf = (
    activity: ActivityView,
    workbench: LessonWorkbench,
    words: StudyWords,
): ReadonlyArray<StudyCardView> => {
    if (activity.kind === "choice") return [choiceCardOf(activity, workbench)]
    if (activity.kind === "simulation" && activity.simulation !== undefined) {
        return [simulationCardOf(activity, activity.simulation, workbench, words)]
    }
    const written: StudyCardView = {
        kind: "written",
        id: activity.id,
        prompt: activity.prompt,
        isDiagnostic: activity.isDiagnostic,
        criteria: activity.criteria,
        instructions: activity.instructions,
        draft: draftOf(activity.id, workbench, words),
    }
    return activity.files.length === 0
        ? [written]
        : [written, { kind: "files", id: `${activity.id}-files`, files: activity.files }]
}

/** The cards of one section: its reading, then its activities. */
export const sectionCardsOf = (
    section: SectionView,
    workbench: LessonWorkbench,
    words: StudyWords,
): ReadonlyArray<StudyCardView> => [
    { kind: "reading", id: section.id, title: section.title, blocks: section.blocks },
    ...section.activities.flatMap((activity) => activityCardsOf(activity, workbench, words)),
]
