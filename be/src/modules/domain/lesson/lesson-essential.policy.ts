import type { EssentialPart } from "@modules/domain/entitlement"
import type { LessonIssue, LessonParsedLocale } from "./lesson-import.contracts"
import {
    PICKED_FEEDBACK_RELEASE,
    type LessonActivity,
    type LessonLocale,
    type LessonPhase,
    type LessonRootFile,
} from "./lesson.contracts"
import {
    choiceOptionId,
    type LessonScenarioGuard,
    type LessonScenarioRun,
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

/** The text of each file of the lesson folder, by its posix path. */
export type LessonFileTexts = ReadonlyMap<string, { readonly text: string }>

/** A challenge with the text of its hidden test sources attached from the lesson folder. */
const withHiddenTexts = (challenge: LessonChallenge, files: LessonFileTexts): LessonChallenge =>
    challenge.hidden === undefined
        ? challenge
        : {
              ...challenge,
              hidden: challenge.hidden.map((hidden) =>
                  hidden.files === undefined
                      ? hidden
                      : {
                            ...hidden,
                            files: hidden.files.map((file) => ({ ...file, content: files.get(file.from)?.text ?? "" })),
                        },
              ),
          }

/**
 * The four-part fields of a root file as stored, with the hidden test sources attached; undefined when it carries none (a
 * lesson written before them).
 */
export const essentialOf = (root: LessonRootFile, files: LessonFileTexts = new Map()): LessonEssential | undefined =>
    hasEssential(root)
        ? {
              opener: root.opener ?? [],
              source: root.source ?? null,
              invariants: root.invariants ?? [],
              architecture: root.architecture ?? null,
              codeWalk: root.codeWalk ?? [],
              scenarios: root.scenarios ?? [],
              challenges: (root.challenges ?? []).map((challenge) => withHiddenTexts(challenge, files)),
          }
        : undefined

/** The issues of hidden test sources the lesson folder does not hold. */
export const hiddenFileIssues = (root: LessonRootFile, files: LessonFileTexts): Array<LessonIssue> =>
    (root.challenges ?? []).flatMap((challenge, index) =>
        (challenge.hidden ?? []).flatMap((hidden, at) =>
            (hidden.files ?? [])
                .filter((file) => !files.has(file.from))
                .map((file) =>
                    issueOf("vi.md", `challenges[${index}].hidden[${at}].files`, `${file.from} is not in the folder`),
                ),
        ),
    )

/** The ids of a list that appear more than once. */
const duplicatesOf = (ids: ReadonlyArray<string>): Array<string> => [
    ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
]

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

/** An id the learner CLI accepts (SCENARIO-CONTRACT v2): a scenario, an invariant, a concept, a guard, a compose project. */
const RUN_ID = /^[a-z0-9-]+$/u

/** An environment variable a guard switches. */
const GUARD_ENV = /^[A-Z][A-Z0-9_]*$/u

/** A path the CLI takes: relative, no `..`, no drive or backslash. */
const isRunPath = (value: string): boolean =>
    /^[A-Za-z0-9._@/-]+$/u.test(value) && !value.startsWith("/") && !value.split("/").includes("..")

/** The issues of how one scenario runs: ids, guards and paths the CLI would refuse. */
const runIssues = (
    run: LessonScenarioRun & { readonly id: string; readonly guards?: ReadonlyArray<LessonScenarioGuard> },
    at: string,
    path: string,
): Array<LessonIssue> => [
    ...(RUN_ID.test(run.id) ? [] : [issueOf(path, `${at}.id`, `${run.id} is not [a-z0-9-]+`)]),
    ...(run.concepts ?? [])
        .filter((concept) => !RUN_ID.test(concept))
        .map((concept) => issueOf(path, `${at}.concepts`, `${concept} is not [a-z0-9-]+`)),
    ...[run.cwd, run.report]
        .flatMap((value) => (value === undefined || isRunPath(value) ? [] : [value]))
        .map((value) => issueOf(path, at, `${value} is not a relative path`)),
    ...(run.guards ?? []).flatMap((guard, index) =>
        RUN_ID.test(guard.name) && GUARD_ENV.test(guard.env) && (guard.off === undefined || RUN_ID.test(guard.off))
            ? []
            : [issueOf(path, `${at}.guards[${index}]`, "needs a [a-z0-9-]+ name and off value and an [A-Z_] env")],
    ),
]

/** The issues of the source repository the CLI pins. */
const sourceIssues = (root: LessonRootFile, path: string): Array<LessonIssue> => {
    const source = root.source
    if (source === undefined) return []
    return [
        ...(source.langs.length === 0 ? [issueOf(path, "source.langs", "names no language")] : []),
        ...[source.dir, source.compose]
            .flatMap((value) => (value === undefined || isRunPath(value) ? [] : [value]))
            .map((value) => issueOf(path, "source", `${value} is not a relative path`)),
        ...(source.project === undefined || RUN_ID.test(source.project)
            ? []
            : [issueOf(path, "source.project", "is not [a-z0-9-]+")]),
    ]
}

/** The invariant ids the four-part fields point at, with where. */
const invariantRefsOf = (root: LessonRootFile): Array<{ readonly id: string; readonly at: string }> => [
    ...(root.architecture?.components ?? []).flatMap((component, index) =>
        component.invariants.map((id) => ({ id, at: `architecture.components[${index}].invariants` })),
    ),
    ...(root.codeWalk ?? []).map((entry, index) => ({ id: entry.invariant, at: `codeWalk[${index}].invariant` })),
    ...(root.scenarios ?? []).map((scenario, index) => ({
        id: scenario.invariant,
        at: `scenarios[${index}].invariant`,
    })),
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
        ...sourceIssues(root, path),
        ...(root.invariants ?? [])
            .filter((invariant) => !RUN_ID.test(invariant.id))
            .map((invariant) => issueOf(path, "invariants", `${invariant.id} is not [a-z0-9-]+`)),
        ...(root.scenarios ?? []).flatMap((scenario, index) => runIssues(scenario, `scenarios[${index}]`, path)),
        ...challenges.flatMap((challenge, index) =>
            (challenge.hidden ?? []).flatMap((hidden, at) => [
                ...runIssues(hidden, `challenges[${index}].hidden[${at}]`, path),
                ...(hidden.files ?? [])
                    .filter((file) => !isRunPath(file.path))
                    .map((file) =>
                        issueOf(
                            path,
                            `challenges[${index}].hidden[${at}].files`,
                            `${file.path} is not a relative path`,
                        ),
                    ),
            ]),
        ),
        ...duplicatesOf(challenges.flatMap((challenge) => (challenge.hidden ?? []).map((hidden) => hidden.id))).map(
            (id) => issueOf(path, "challenges", `hidden scenario id ${id} appears twice`),
        ),
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
            `scenario ${scenario.id} ${scenario.invariant} ${JSON.stringify([scenario.command, scenario.guards, scenario.concepts ?? [], scenario.cwd ?? "", scenario.report ?? "", scenario.timeoutMs ?? 0])}`,
    ),
    ...(root.challenges ?? []).flatMap((challenge) => [
        `challenge ${challenge.id} ${challenge.level} ${challenge.hiddenScenarios ?? 0}`,
        ...(challenge.hidden ?? []).map(
            (hidden) =>
                `hidden ${challenge.id}/${hidden.id} ${JSON.stringify([hidden.command, hidden.concepts ?? [], hidden.cwd ?? "", hidden.report ?? "", hidden.timeoutMs ?? 0, hidden.files ?? []])}`,
        ),
        ...challenge.rubric.map(
            (criterion) =>
                `rubric ${challenge.id}/${criterion.id} ${criterion.points} ${String(criterion.isCritical === true)}`,
        ),
        ...(challenge.questions ?? []).flatMap((question) => questionLines(`question ${challenge.id}`, question)),
    ]),
]

/**
 * A question as a stored choice activity: one option per choice, the explanation released with each after the submit. An opener
 * question (`isOpener`) is graded one pick at a time: only the picked option is released, and the right one carries its insight.
 */
const choiceActivityOf = (id: string, question: LessonOpenerQuestion, isOpener: boolean): LessonActivity => ({
    id,
    kind: "choice",
    prompt: question.prompt,
    responseKind: "single-choice",
    evaluationMethod: "deterministic",
    isDiagnostic: isOpener,
    feedbackRelease: isOpener ? PICKED_FEEDBACK_RELEASE : "after-submit",
    outcomeIds: [],
    options: question.choices.map((label, index) => ({
        id: choiceOptionId(index),
        label,
        explanation: question.choiceExplanations?.[index] ?? question.explanation,
        isCorrect: index === question.correctIndex,
        ...(isOpener && index === question.correctIndex && question.insight !== undefined
            ? { insight: { ...question.insight } }
            : {}),
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
    /** The part it belongs to; the entitlement setting says whether that part is free. */
    readonly part: EssentialPart
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
            : {
                  activity: choiceActivityOf(activityId, question, true),
                  phase: "challenge",
                  isPremium: false,
                  part: "1-essential",
              }
    }
    if (!activityId.startsWith(CHALLENGE_PREFIX)) return null
    for (const challenge of essential.challenges) {
        const question = (challenge.questions ?? []).find(
            (each) => `${CHALLENGE_PREFIX}${challenge.id}.${each.id}` === activityId,
        )
        if (question !== undefined)
            return {
                activity: choiceActivityOf(activityId, question, false),
                phase: "apply",
                isPremium: true,
                part: "4-apply",
            }
    }
    return null
}
