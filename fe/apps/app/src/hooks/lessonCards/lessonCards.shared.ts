import { evidenceFieldsOf, evidenceKeyOf } from "@/hooks/lessonEvidence"
import { withDownloads } from "@/hooks/lessonFiles"
import { branchActionsOf, stepsOfWalk, triedActionsOf } from "@/hooks/lessonWalk"
import { markdownForLanguage, variantsOfFiles } from "@/modules/lesson-view"
import type { AttemptState, LessonWorkbench } from "@/hooks/lesson"
import type {
    ActivityView,
    AttemptStatus,
    LessonPhase,
    SectionView,
    SimulationView,
    StudyCardView,
    StudyWords,
    WrittenDraftView,
} from "@/modules/types"

/** The status an activity shows: its attempt's, or idle before the first submit. */
const statusOf = (attempt: AttemptState | undefined): AttemptStatus => attempt?.status ?? "idle"

/** A number as two digits. */
const twoDigits = (n: number): string => String(n).padStart(2, "0")

/** HH:mm of an ISO time in the learner's zone; empty for an empty or unreadable time. */
export const timeOf = (iso: string): string => {
    const date = new Date(iso)
    if (iso === "" || Number.isNaN(date.getTime())) return ""
    return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`
}

/** The time an attempt was saved, HH:mm; empty before the server has one. */
const savedAtOf = (attempt: AttemptState | undefined): string => timeOf(attempt?.view?.savedAt ?? "")

/** Why a grading failed, in the kinds the screen words: no AI provider is configured, the daily allowance is used up, or anything else. */
const issueOf = (attempt: AttemptState | undefined): WrittenDraftView["issue"] => {
    const code = attempt?.view?.failureCode ?? ""
    if (code === "") return "none"
    if (code === "ATTEMPT_COACH_UNCONFIGURED") return "unconfigured"
    return code === "ATTEMPT_COACH_LIMIT_REACHED" ? "limit" : "other"
}

/** The written draft of an activity: the text held (else the text the server kept), where its attempt stands and the grade once the server gave one. */
export const draftOf = (activityId: string, workbench: LessonWorkbench, words: StudyWords): WrittenDraftView => {
    const attempt = workbench.attempts[activityId]
    const result = attempt?.view?.result
    const isGraded = result !== undefined && result.criteria.length > 0
    const saved = attempt?.view?.answer
    return {
        value: workbench.answers[activityId] ?? (saved?.text === "" ? saved.debrief : saved?.text) ?? "",
        status: statusOf(attempt),
        issue: issueOf(attempt),
        criteria: result?.criteria ?? [],
        scoreLine: isGraded ? words.score(result.score, result.maxScore) : "",
        scoreShort: isGraded ? `${result.score}/${result.maxScore}` : "",
        isDiagnostic: result?.isDiagnostic ?? false,
        savedAt: savedAtOf(attempt),
    }
}

/** The explanations a graded choice released, keyed by option id; empty before the grade. */
const explanationsOf = (attempt: AttemptState | undefined): Readonly<Record<string, string>> =>
    Object.fromEntries((attempt?.view?.result?.options ?? []).map((option) => [option.optionId, option.explanation]))

/** The option a choice holds: the one picked in this visit, else the one the saved attempt carries. */
const pickedOf = (activityId: string, workbench: LessonWorkbench, attempt: AttemptState | undefined): string =>
    workbench.picks[activityId] ?? attempt?.view?.answer.optionId ?? ""

/** The choice card of a choice activity; in the explain phase it is the quick check after a theory section. */
const choiceCardOf = (activity: ActivityView, phase: LessonPhase, workbench: LessonWorkbench): StudyCardView => {
    const attempt = workbench.attempts[activity.id]
    return {
        kind: "choice",
        id: activity.id,
        prompt: activity.prompt,
        options: activity.options,
        pickedId: pickedOf(activity.id, workbench, attempt),
        status: statusOf(attempt),
        isCorrect: attempt?.view?.result?.correct === true,
        explanations: explanationsOf(attempt),
        correctId: attempt?.view?.result?.options.find((option) => option.isCorrect)?.optionId ?? "",
        isCheck: phase === "explain",
        savedAt: savedAtOf(attempt),
    }
}

/** The simulation card of a simulation activity, run from the public projection of its state machine and resumed from the walk the server saved. */
const simulationCardOf = (
    activity: ActivityView,
    simulation: SimulationView,
    workbench: LessonWorkbench,
    words: StudyWords,
): StudyCardView => {
    const saved = workbench.simulations[activity.id]
    const steps = workbench.walks[activity.id] ?? stepsOfWalk(simulation, saved)
    const lastStateId = steps.at(-1)?.toStateId ?? simulation.initialStateId
    return {
        kind: "simulation",
        id: activity.id,
        prompt: activity.prompt,
        initialStateId: simulation.initialStateId,
        states: simulation.states.map((state) => ({ ...state, facts: state.facts })),
        actions: branchActionsOf(simulation.actions),
        transitions: simulation.edges.map((edge) => ({
            fromStateId: edge.fromStateId,
            actionId: edge.actionId,
            toStateId: edge.toStateId,
        })),
        initialSteps: steps,
        initialTriedActionIds: triedActionsOf(simulation, saved),
        isRestored: workbench.isRestored,
        isSuccess: simulation.states.find((state) => state.id === lastStateId)?.isSuccess ?? false,
        debrief: simulation.debriefQuestion,
        draft: draftOf(activity.id, workbench, words),
    }
}

/** What the cards of a section need besides the section: the words and the lesson. */
export type CardContext = {
    readonly words: StudyWords
    readonly lessonId: string
    /** True when the section hands the learner a lab (the workspace of the lesson): its exercise asks for evidence from a test run. */
    readonly hasLab: boolean
}

/** The cards of one activity: the card of its kind, then the files an exercise hands over. */
const activityCardsOf = (
    activity: ActivityView,
    phase: LessonPhase,
    workbench: LessonWorkbench,
    context: CardContext,
): ReadonlyArray<StudyCardView> => {
    const { words, lessonId } = context
    if (activity.kind === "choice") return [choiceCardOf(activity, phase, workbench)]
    if (activity.kind === "simulation" && activity.simulation !== undefined) {
        return [simulationCardOf(activity, activity.simulation, workbench, words)]
    }
    const variants = variantsOfFiles(activity.files)
    const files: ReadonlyArray<StudyCardView> =
        activity.files.length === 0
            ? []
            : [
                  {
                      kind: "files",
                      id: `${activity.id}-files`,
                      files: activity.files,
                      ...(variants.length === 0 ? {} : { variants: withDownloads(variants, lessonId), selectedVariant: workbench.language }),
                  },
              ]
    if (activity.kind === "exercise" && (activity.files.length > 0 || context.hasLab)) {
        const saved = evidenceFieldsOf(workbench.attempts[activity.id]?.view?.answer.text ?? "")
        const hint = activity.instructions === "" || activity.instructions === activity.prompt ? "" : `\n\n${activity.instructions}`
        return [
            ...files,
            {
                kind: "evidence",
                id: activity.id,
                task: `${activity.prompt}${hint}`,
                outputValue: workbench.answers[evidenceKeyOf(activity.id, "output")] ?? saved.output,
                explanationValue: workbench.answers[evidenceKeyOf(activity.id, "explanation")] ?? saved.explanation,
                draft: draftOf(activity.id, workbench, words),
            },
        ]
    }
    return [
        {
            kind: "written",
            id: activity.id,
            prompt: activity.prompt,
            isDiagnostic: activity.isDiagnostic,
            criteria: activity.criteria,
            instructions: activity.instructions,
            draft: draftOf(activity.id, workbench, words),
        },
        ...files,
    ]
}

/** The cards of one section: its reading, then its activities. */
export const sectionCardsOf = (
    section: SectionView,
    workbench: LessonWorkbench,
    context: CardContext,
): ReadonlyArray<StudyCardView> => {
    const isMultiLanguage = section.activities.some((activity) => variantsOfFiles(activity.files).length > 0)
    return [
        {
            kind: "reading",
            id: section.id,
            title: section.title,
            markdown: isMultiLanguage ? markdownForLanguage(section.markdown, workbench.language) : section.markdown,
        },
        ...section.activities.flatMap((activity) => activityCardsOf(activity, section.phase, workbench, context)),
    ]
}
