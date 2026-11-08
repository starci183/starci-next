import { LESSON_LOCALES, type LessonActivity, type LessonLocale, type LessonSimulation } from "./lesson.contracts"
import type { LessonIssue, LessonParsedLocale, LessonParsedSource } from "./lesson-import.contracts"

const issueOf = (path: string, field: string, message: string): LessonIssue => ({ path, field, message })

/** Whether some state with `isSuccess` is reachable from the initial state by the transitions. */
const reachesSuccess = (simulation: LessonSimulation): boolean => {
    const goals = new Set(simulation.states.filter((state) => state.isSuccess).map((state) => state.id))
    const seen = new Set<string>([simulation.initialStateId])
    const queue = [simulation.initialStateId]
    for (const current of queue) {
        simulation.transitions
            .filter((transition) => transition.fromStateId === current && !seen.has(transition.toStateId))
            .forEach((transition) => {
                seen.add(transition.toStateId)
                queue.push(transition.toStateId)
            })
    }
    return [...seen].some((id) => goals.has(id))
}

const simulationIssues = (simulation: LessonSimulation, path: string, at: string): Array<LessonIssue> => {
    const states = new Set(simulation.states.map((state) => state.id))
    const actions = new Set(simulation.actions.map((action) => action.id))
    const issues: Array<LessonIssue> = []
    if (!states.has(simulation.initialStateId)) {
        issues.push(issueOf(path, `${at}.initialStateId`, `${simulation.initialStateId} is not a state`))
    }
    simulation.transitions.forEach((transition, index) => {
        const field = `${at}.transitions[${index}]`
        if (!states.has(transition.fromStateId)) issues.push(issueOf(path, `${field}.fromStateId`, "is not a state"))
        if (!states.has(transition.toStateId)) issues.push(issueOf(path, `${field}.toStateId`, "is not a state"))
        if (!actions.has(transition.actionId)) issues.push(issueOf(path, `${field}.actionId`, "is not an action"))
    })
    if (issues.length === 0 && !reachesSuccess(simulation)) {
        issues.push(issueOf(path, at, "reaches no success state from its initial state"))
    }
    return issues
}

/** True when the activity can be graded without guessing: a rubric, one correct option among several, or a simulation. */
const isGradable = (activity: LessonActivity): boolean => {
    const options = activity.options ?? []
    return (
        (activity.rubric?.length ?? 0) > 0 ||
        (options.length > 1 && options.filter((option) => option.isCorrect).length === 1) ||
        activity.simulation !== undefined
    )
}

const activityIssues = (
    activity: LessonActivity,
    outcomes: ReadonlySet<string>,
    path: string,
    at: string,
): Array<LessonIssue> => {
    const issues = activity.outcomeIds
        .filter((id) => !outcomes.has(id))
        .map((id) => issueOf(path, `${at}.outcomeIds`, `${id} is not a learning outcome`))
    if (!isGradable(activity)) {
        issues.push(issueOf(path, at, `${activity.id} has no rubric, no single correct option and no simulation`))
    }
    if (activity.simulation) issues.push(...simulationIssues(activity.simulation, path, `${at}.simulation`))
    return issues
}

/** One activity with where it was found. */
interface Located {
    readonly activity: LessonActivity
    readonly path: string
    readonly at: string
}

const locatedActivities = (locale: LessonLocale, parsed: LessonParsedLocale): Array<Located> => [
    ...(parsed.root.activities ?? []).map((activity, index) => ({
        activity,
        path: `${locale}.md`,
        at: `activities[${index}]`,
    })),
    ...parsed.sections.flatMap((section) =>
        (section.activities ?? []).map((activity, index) => ({
            activity,
            path: `sections/${section.id}/${locale}.md`,
            at: `activities[${index}]`,
        })),
    ),
]

const localeIssues = (locale: LessonLocale, parsed: LessonParsedLocale): Array<LessonIssue> => {
    const outcomes = new Set(parsed.root.learningOutcomes.map((outcome) => outcome.id))
    const issues: Array<LessonIssue> = []
    if (outcomes.size === 0) issues.push(issueOf(`${locale}.md`, "learningOutcomes", "holds no outcome"))
    if (!parsed.sections.some((section) => section.phase === "challenge")) {
        issues.push(issueOf("sections", "", `${locale} has no section in the challenge phase`))
    }
    const seen = new Set<string>()
    locatedActivities(locale, parsed).forEach(({ activity, path, at }) => {
        if (seen.has(activity.id)) issues.push(issueOf(path, at, `activity id ${activity.id} appears twice`))
        seen.add(activity.id)
        issues.push(...activityIssues(activity, outcomes, path, at))
    })
    return issues
}

const activityLines = (activity: LessonActivity): Array<string> => [
    `activity ${activity.id} ${activity.kind} ${activity.outcomeIds.join(",")}`,
    ...(activity.options ?? []).map((option) => `option ${activity.id}/${option.id} ${String(option.isCorrect)}`),
    ...(activity.rubric ?? []).map((criterion) => `criterion ${activity.id}/${criterion.id} ${criterion.maxScore}`),
    ...(activity.simulation?.states ?? []).map(
        (state) => `state ${activity.id}/${state.id} ${String(state.isSuccess)}`,
    ),
    ...(activity.simulation?.actions ?? []).map((action) => `action ${activity.id}/${action.id}`),
    ...(activity.simulation?.transitions ?? []).map(
        (transition) =>
            `transition ${activity.id}/${transition.id} ${transition.fromStateId} ${transition.actionId} ${transition.toStateId}`,
    ),
    ...(activity.exercise?.files ?? []).map((file) => `exercise ${activity.id}/${file.relativePath} ${file.role}`),
]

/** The structural lines of a locale: everything two translations of the same lesson must share. */
const structureOf = (parsed: LessonParsedLocale): Array<string> => [
    `meta ${parsed.root.category} ${parsed.root.difficulty} ${parsed.root.minutesRead} ${parsed.root.implementation} ${parsed.root.sortIndex}`,
    `workspace ${JSON.stringify(parsed.root.workspace ?? null)}`,
    ...parsed.root.learningOutcomes.map((outcome) => `outcome ${outcome.id}`),
    ...parsed.root.prerequisites.map((prerequisite) => `prerequisite ${prerequisite.id}`),
    ...parsed.root.references.map((reference) => `reference ${reference.id} ${reference.url ?? ""}`),
    ...(parsed.root.activities ?? []).flatMap((activity) => activityLines(activity)),
    ...parsed.sections.flatMap((section) => [
        `section ${section.id} ${section.phase} ${section.sortIndex}`,
        ...(section.activities ?? []).flatMap((activity) => activityLines(activity)),
    ]),
]

const parityIssues = (parsed: LessonParsedSource): Array<LessonIssue> => {
    const viLines = structureOf(parsed.vi)
    const enLines = structureOf(parsed.en)
    const vi = new Set(viLines)
    const en = new Set(enLines)
    return [
        ...viLines
            .filter((line) => !en.has(line))
            .map((line) => issueOf("en.md", "", `differs from vi.md: lacks "${line}"`)),
        ...enLines
            .filter((line) => !vi.has(line))
            .map((line) => issueOf("vi.md", "", `differs from en.md: lacks "${line}"`)),
    ]
}

/**
 * Checks what the shapes cannot: ids resolve inside the lesson, every activity can be graded, every simulation reaches a
 * success state and the two locales share one structure.
 */
export const validateLesson = (parsed: LessonParsedSource): Array<LessonIssue> => [
    ...LESSON_LOCALES.flatMap((locale) => localeIssues(locale, parsed[locale])),
    ...parityIssues(parsed),
]
