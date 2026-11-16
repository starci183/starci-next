import type { LessonIssue, LessonParsedLocale } from "./lesson-import.contracts"
import type { LessonActivity, LessonLocale, LessonPhase, LessonRootFile } from "./lesson.contracts"
import {
    choiceOptionId,
    type LessonChallenge,
    type LessonEssential,
    type LessonOpenerQuestion,
} from "./lesson-essential.contracts"

/** How many questions the opener asks (COOK 2026-11-17: five multiple-choice interview questions). */
export const LESSON_OPENER_SIZE = 5

/** The points a challenge rubric adds up to. */
export const LESSON_CHALLENGE_POINTS = 100

/** The prefix of the activity id of an opener question. */
const OPENER_PREFIX = "opener."

/** The prefix of the activity id of a challenge question. */
const CHALLENGE_PREFIX = "challenge."

const issueOf = (path: string, field: string, message: string): LessonIssue => ({ path, field, message })

/** True when the root file carries any of the four-part fields. */
const hasEssential = (root: LessonRootFile): boolean =>
    root.opener !== undefined ||
    root.source !== undefined ||
    root.invariants !== undefined ||
    root.architecture !== undefined ||
    root.codeWalk !== undefined ||
    root.scenarios !== undefined ||
    root.challenges !== undefined

/** The four-part fields of a root file as stored, or undefined when it carries none (a lesson written before them). */
export const essentialOf = (root: LessonRootFile): LessonEssential | undefined =>
    hasEssential(root)
        ? {
              opener: root.opener ?? [],
              source: root.source ?? null,
              invariants: root.invariants ?? [],
              architecture: root.architecture ?? null,
              codeWalk: root.codeWalk ?? [],
              scenarios: root.scenarios ?? [],
              challenges: root.challenges ?? [],
          }
        : undefined

/** The ids of a list that appear more than once. */
const duplicatesOf = (ids: ReadonlyArray<string>): Array<string> =>
    [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]

/** The issues of one question: two choices at least, a right index among them, and links that resolve inside the lesson. */
const questionIssues = (
    question: LessonOpenerQuestion,
    at: string,
    path: string,
    sections: ReadonlySet<string>,
    scenarios: ReadonlySet<string>,
): Array<LessonIssue> => [
    ...(question.choices.length < 2 ? [issueOf(path, `${at}.choices`, "needs two choices at least")] : []),
    ...(question.correctIndex >= question.choices.length
        ? [issueOf(path, `${at}.correctIndex`, `${question.correctIndex} is not a choice`)]
        : []),
    ...(question.sectionId !== undefined && !sections.has(question.sectionId)
        ? [issueOf(path, `${at}.sectionId`, `${question.sectionId} is not a section`)]
        : []),
    ...(question.scenarioId !== undefined && !scenarios.has(question.scenarioId)
        ? [issueOf(path, `${at}.scenarioId`, `${question.scenarioId} is not a scenario`)]
        : []),
]

/** The issues of one challenge: its rubric adds up to 100 with one critical criterion at most. */
const challengeIssues = (challenge: LessonChallenge, at: string, path: string): Array<LessonIssue> => {
    const total = challenge.rubric.reduce((sum, criterion) => sum + criterion.points, 0)
    const critical = challenge.rubric.filter((criterion) => criterion.isCritical === true).length
    return [
        ...(total === LESSON_CHALLENGE_POINTS
            ? []
            : [issueOf(path, `${at}.rubric`, `adds up to ${total}, not ${LESSON_CHALLENGE_POINTS}`)]),
        ...(critical > 1 ? [issueOf(path, `${at}.rubric`, "holds more than one critical criterion")] : []),
    ]
}

/** The invariant ids the four-part fields point at, with where. */
const invariantRefsOf = (root: LessonRootFile): Array<{ readonly id: string; readonly at: string }> => [
    ...(root.architecture?.components ?? []).flatMap((component, index) =>
        component.invariants.map((id) => ({ id, at: `architecture.components[${index}].invariants` })),
    ),
    ...(root.codeWalk ?? []).map((entry, index) => ({ id: entry.invariant, at: `codeWalk[${index}].invariant` })),
    ...(root.scenarios ?? []).map((scenario, index) => ({ id: scenario.invariant, at: `scenarios[${index}].invariant` })),
]

/**
 * Checks what the shapes cannot in the four-part fields of one locale: five opener questions, right indexes among the
 * choices, links to sections and scenarios that exist, invariants that resolve, unique ids and rubrics of 100 points.
 */
export const essentialIssues = (locale: LessonLocale, parsed: LessonParsedLocale): Array<LessonIssue> => {
    const { root } = parsed
    if (!hasEssential(root)) return []
    const path = `${locale}.md`
    const sections = new Set(parsed.sections.map((section) => section.id))
    const scenarios = new Set((root.scenarios ?? []).map((scenario) => scenario.id))
    const invariants = new Set((root.invariants ?? []).map((invariant) => invariant.id))
    const opener = root.opener ?? []
    const challenges = root.challenges ?? []
    const questionIds = [
        ...opener.map((question) => question.id),
        ...challenges.flatMap((challenge) => (challenge.questions ?? []).map((question) => question.id)),
    ]
    return [
        ...(root.opener !== undefined && opener.length !== LESSON_OPENER_SIZE
            ? [issueOf(path, "opener", `holds ${opener.length} questions, not ${LESSON_OPENER_SIZE}`)]
            : []),
        ...opener.flatMap((question, index) => questionIssues(question, `opener[${index}]`, path, sections, scenarios)),
        ...challenges.flatMap((challenge, index) => [
            ...challengeIssues(challenge, `challenges[${index}]`, path),
            ...(challenge.questions ?? []).flatMap((question, at) =>
                questionIssues(question, `challenges[${index}].questions[${at}]`, path, sections, scenarios),
            ),
        ]),
        ...(root.source !== undefined && root.source.langs.length === 0
            ? [issueOf(path, "source.langs", "names no language")]
            : []),
        ...invariantRefsOf(root)
            .filter((ref) => !invariants.has(ref.id))
            .map((ref) => issueOf(path, ref.at, `${ref.id} is not an invariant`)),
        ...duplicatesOf(questionIds).map((id) => issueOf(path, "opener", `question id ${id} appears twice`)),
        ...duplicatesOf((root.scenarios ?? []).map((scenario) => scenario.id)).map((id) =>
            issueOf(path, "scenarios", `scenario id ${id} appears twice`),
        ),
        ...duplicatesOf((root.codeWalk ?? []).map((entry) => entry.id)).map((id) =>
            issueOf(path, "codeWalk", `entry id ${id} appears twice`),
        ),
        ...duplicatesOf(challenges.map((challenge) => challenge.id)).map((id) =>
            issueOf(path, "challenges", `challenge id ${id} appears twice`),
        ),
        ...duplicatesOf(challenges.map((challenge) => challenge.level)).map((level) =>
            issueOf(path, "challenges", `level ${level} appears twice`),
        ),
    ]
}

/** The structural lines of one question: what two translations must share. */
const questionLines = (prefix: string, question: LessonOpenerQuestion): Array<string> => [
    `${prefix} ${question.id} ${question.choices.length} ${question.correctIndex} ${question.sectionId ?? ""} ${question.scenarioId ?? ""}`,
]

/**
 * The structural lines of the four-part fields: the ids, the right indexes, the links, the repository, the code (file, line,
 * snippet), the commands and guards and the rubric points, which the two locales must share. Only the words may differ.
 */
export const essentialStructureOf = (root: LessonRootFile): Array<string> => [
    `essential ${String(hasEssential(root))}`,
    `source ${JSON.stringify(root.source ?? null)}`,
    ...(root.opener ?? []).flatMap((question) => questionLines("opener", question)),
    ...(root.invariants ?? []).map((invariant) => `invariant ${invariant.id}`),
    ...(root.architecture?.components ?? []).map(
        (component) => `component ${component.name} ${component.port ?? ""} ${component.invariants.join(",")}`,
    ),
    ...(root.codeWalk ?? []).map(
        (entry) => `code ${entry.id} ${entry.invariant} ${entry.file}:${entry.line} ${JSON.stringify(entry.snippet)}`,
    ),
    ...(root.scenarios ?? []).map(
        (scenario) =>
            `scenario ${scenario.id} ${scenario.invariant} ${JSON.stringify(scenario.command)} ${scenario.guards.join(",")}`,
    ),
    ...(root.challenges ?? []).flatMap((challenge) => [
        `challenge ${challenge.id} ${challenge.level} ${challenge.hiddenScenarios ?? 0}`,
        ...challenge.rubric.map(
            (criterion) =>
                `rubric ${challenge.id}/${criterion.id} ${criterion.points} ${String(criterion.isCritical === true)}`,
        ),
        ...(challenge.questions ?? []).flatMap((question) => questionLines(`question ${challenge.id}`, question)),
    ]),
]

/** A question as a stored choice activity: one option per choice, the explanation released with each after the submit. */
const choiceActivityOf = (id: string, question: LessonOpenerQuestion, isDiagnostic: boolean): LessonActivity => ({
    id,
    kind: "choice",
    prompt: question.prompt,
    responseKind: "single-choice",
    evaluationMethod: "deterministic",
    isDiagnostic,
    feedbackRelease: "after-submit",
    outcomeIds: [],
    options: question.choices.map((label, index) => ({
        id: choiceOptionId(index),
        label,
        explanation: question.explanation,
        isCorrect: index === question.correctIndex,
    })),
})

/** An activity found among the four-part fields: the choice, the phase it is graded in and the teacher's mark. */
export interface EssentialActivity {
    /** The question as a choice activity. */
    readonly activity: LessonActivity
    /** The phase: the opener is the free challenge phase, a challenge question the apply phase. */
    readonly phase: LessonPhase
    /** The mark: the opener is always free; a challenge question needs Premium. */
    readonly isPremium: boolean
}

/**
 * Finds a question of the four-part fields by its activity id (`opener.<id>`, `challenge.<challenge>.<id>`) as a choice the
 * attempts grade deterministically; null for any other id.
 */
export const findEssentialActivity = (
    essential: LessonEssential | undefined,
    activityId: string,
): EssentialActivity | null => {
    if (essential === undefined) return null
    if (activityId.startsWith(OPENER_PREFIX)) {
        const question = essential.opener.find((each) => `${OPENER_PREFIX}${each.id}` === activityId)
        return question === undefined
            ? null
            : { activity: choiceActivityOf(activityId, question, true), phase: "challenge", isPremium: false }
    }
    if (!activityId.startsWith(CHALLENGE_PREFIX)) return null
    for (const challenge of essential.challenges) {
        const question = (challenge.questions ?? []).find(
            (each) => `${CHALLENGE_PREFIX}${challenge.id}.${each.id}` === activityId,
        )
        if (question !== undefined)
            return { activity: choiceActivityOf(activityId, question, false), phase: "apply", isPremium: true }
    }
    return null
}

