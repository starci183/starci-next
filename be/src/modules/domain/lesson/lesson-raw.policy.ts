import { parse } from "yaml"
import { isRecord } from "@modules/platform/primitives"
import { contentHashOf } from "./lesson-draft.policy"
import { groupOf } from "./lesson-group.policy"
import { parseSeparatorFields } from "./separator.policy"
import { LESSON_BUGS_SOURCE_FOLDER as BUGS_FOLDER, sourceCodeOf } from "./lesson-source-archive.policy"
import { topicSourceOf } from "./lesson-topic-file.policy"
import type { LessonTopicCatalog } from "./lesson-topic.contracts"
import type { LessonDraftResult, LessonIssue, LessonSourceFile } from "./lesson-import.contracts"
import {
    LESSON_LOCALES,
    type LessonContent,
    type LessonDifficulty,
    type LessonLocale,
    type LessonLocaleDocument,
    type LessonPhase,
    type LessonSection,
} from "./lesson.contracts"
import {
    LESSON_CHALLENGE_LEVELS,
    LESSON_ESSENCE_SECTION,
    LESSON_PATTERN_STATUSES,
    type LessonBugPack,
    type LessonBugTest,
    type LessonChallenge,
    type LessonChallengeLevel,
    type LessonEssential,
    type LessonHiddenScenario,
    type LessonOpenerEvent,
    type LessonGlossaryEntry,
    type LessonOpenerCode,
    type LessonOpenerFigure,
    type LessonOpenerInterviewBeats,
    type LessonOpenerStep,
    type LessonOpenerInsight,
    type LessonOpenerQuestion,
    type LessonOpenerStory,
    type LessonPattern,
    type LessonPatternFile,
    type LessonReading,
    type LessonReadingCheck,
    type LessonScenario,
} from "./lesson-essential.contracts"
import { LESSON_CHALLENGE_POINTS, LESSON_OPENER_SIZE } from "./lesson-essential.policy"

/**
 * The topic-based lesson format of starci-next-seed-standard (`raw/essentials/<topic>/<lesson>/`, owner 2026-11-17), converted
 * to the records the app stores: `vi.md` and `en.md` (separator fields), `sections/{1-essential,2-source,3-scenarios,4-apply}`
 * (one per part), `sections/1-essential/quiz.yaml` (the opener), `scenarios.yaml` (scenarios, invariants, how the source
 * runs), `sections/4-apply/challenges.yaml` (the ladder), `hidden/challenge-scenarios.yaml` and `hidden/essence-answers.yaml`
 * (grading, never sent to a page), `hidden/tests/` (the hidden test sources) and `source/` (the one part a learner pulls).
 * `convertRawLesson` is pure: files in, a draft or the issues out; the importer and the seed adapter both call it.
 */

/** The four part sections in order, with the phase each is stored under (the article of Bản chất is the explain phase). */
const PART_SECTIONS: ReadonlyArray<{ readonly id: string; readonly phase: LessonPhase }> = [
    { id: "1-essential", phase: "explain" },
    { id: "2-source", phase: "explore" },
    { id: "3-scenarios", phase: "apply" },
    { id: "4-apply", phase: "reflect" },
]

/** What the converter is given: where the lesson sits and every file of its folder (paths relative to it). */
export interface RawLessonInput {
    /** The topic folder (`api-reliability`). */
    readonly topic: string
    /** The lesson folder (`outbox-idempotency`), which is the lesson id. */
    readonly folder: string
    /** Every file of the lesson folder. */
    readonly files: ReadonlyArray<LessonSourceFile>
    /** The text of the topic's `topic.yaml`, when the topic folder has one; it wins over the catalog entry of the topic. */
    readonly topicFile?: string | null
}

/** True when a lesson folder is in the topic-based format: it holds `scenarios.yaml` and `sections/1-essential`. */
export const isRawLesson = (files: ReadonlyArray<LessonSourceFile>): boolean =>
    files.some((file) => file.path === "scenarios.yaml") &&
    files.some((file) => file.path.startsWith("sections/1-essential/"))

/** A text in both locales (`{ vi, en }`), or one text for both. */
type Localized = string | { readonly vi?: string; readonly en?: string }

/** The text of a localized value in one locale, falling back to the other and to an empty text. */
const textOf = (value: unknown, locale: LessonLocale): string => {
    if (typeof value === "string") return value
    if (!isRecord(value)) return ""
    const own = value[locale]
    const other = value[locale === "vi" ? "en" : "vi"]
    if (typeof own === "string") return own
    return typeof other === "string" ? other : ""
}

/** The issue collector of one conversion. */
class Issues {
    readonly list: Array<LessonIssue> = []

    add(path: string, field: string, message: string): void {
        this.list.push({ path, field, message })
    }
}

/** A YAML file of the folder as a record, or null with an issue when it is missing or not a mapping. */
const yamlOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    path: string,
    issues: Issues,
): Record<string, unknown> | null => {
    const file = byPath.get(path)
    if (file === undefined) {
        issues.add(path, "", "is missing")
        return null
    }
    try {
        const value: unknown = parse(file.text)
        if (isRecord(value)) return value
        issues.add(path, "", "is not a mapping")
    } catch (cause) {
        issues.add(path, "", `is not valid yaml: ${String(cause)}`)
    }
    return null
}

/** The separator fields of a markdown file, or null with an issue when it is missing. */
const fieldsOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    path: string,
    issues: Issues,
): Readonly<Record<string, string>> | null => {
    const file = byPath.get(path)
    if (file === undefined) {
        issues.add(path, "", "is missing")
        return null
    }
    const parsed = parseSeparatorFields(file.text)
    parsed.problems.forEach((problem) => issues.add(path, "", problem))
    return parsed.fields
}

/** A list member of a record as records, or an empty list. */
const recordsOf = (value: unknown): Array<Record<string, unknown>> =>
    Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => isRecord(item)) : []

/** A text member, or an empty text. */
const stringOf = (value: unknown): string => (typeof value === "string" ? value : "")

/** A list of texts, or an empty list. */
const stringsOf = (value: unknown): Array<string> =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

/** The path of the opener file. */
const QUIZ_PATH = "sections/1-essential/quiz.yaml"

/** The time an event of the story happens at, as the timeline labels it: `21:03`, `09:15`. */
const EVENT_AT = /^([01]?\d|2[0-3]):[0-5]\d$/u

/** The text of a localized field, with an issue (Vietnamese only, like the other opener checks) when it is empty. */
const requiredTextOf = (value: unknown, locale: LessonLocale, field: string, issues: Issues): string => {
    const text = textOf(value as Localized, locale)
    if (locale === "vi" && text.trim() === "") issues.add(QUIZ_PATH, field, "is empty")
    return text
}

/**
 * The situation the opener tells (`story: { title, body }` at the top of `quiz.yaml`), or null when the file has none: a lesson
 * written before the story still imports. When present, both texts are needed.
 */
const storyOf = (quiz: Record<string, unknown>, locale: LessonLocale, issues: Issues): LessonOpenerStory | null => {
    if (quiz.story === undefined) return null
    if (!isRecord(quiz.story)) {
        if (locale === "vi") issues.add(QUIZ_PATH, "story", "is not a mapping of title and body")
        return null
    }
    const company =
        quiz.story.company === undefined ? "" : requiredTextOf(quiz.story.company, locale, "story.company", issues)
    const facts = Array.isArray(quiz.story.facts)
        ? quiz.story.facts.map((fact) => textOf(fact, locale)).filter((fact) => fact !== "")
        : []
    const system = figureOf(quiz.system, locale, "system", ["flowchart"], issues)
    const glossary = glossaryOf(quiz.glossary, locale, issues)
    return {
        title: requiredTextOf(quiz.story.title, locale, "story.title", issues),
        body: requiredTextOf(quiz.story.body, locale, "story.body", issues),
        ...(company === "" ? {} : { company }),
        ...(facts.length === 0 ? {} : { facts }),
        ...(system === undefined ? {} : { system }),
        ...(glossary.length === 0 ? {} : { glossary }),
    }
}

/** A Mermaid figure with its caption (`{ diagram, caption }`), or undefined when absent; both are needed when present. */
const figureOf = (
    value: unknown,
    locale: LessonLocale,
    field: string,
    kinds: ReadonlyArray<string>,
    issues: Issues,
): LessonOpenerFigure | undefined => {
    if (value === undefined) return undefined
    if (!isRecord(value)) {
        if (locale === "vi") issues.add(QUIZ_PATH, field, "is not a mapping of diagram and caption")
        return undefined
    }
    return {
        diagram: diagramOf(value.diagram, locale, `${field}.diagram`, issues, kinds) ?? "",
        caption: requiredTextOf(value.caption, locale, `${field}.caption`, issues),
    }
}

/** The lesson's glossary (`glossary: [{ term, definition }]`): one line per term, in the order written. */
const glossaryOf = (value: unknown, locale: LessonLocale, issues: Issues): Array<LessonGlossaryEntry> =>
    recordsOf(value).map((entry, index) => ({
        term: stringOf(entry.term),
        definition: requiredTextOf(entry.definition, locale, `glossary[${index}].definition`, issues),
    }))

/** The texts of a list of localized texts (`steps`), empty ones dropped. */
const textsOf = (value: unknown, locale: LessonLocale): Array<string> =>
    Array.isArray(value) ? value.map((each) => textOf(each, locale)).filter((each) => each !== "") : []

/** Chuyện gì đã xảy ra (`happened: [{ who, text, fault? }]`): the numbered steps, the faulty one marked. */
const happenedOf = (value: unknown, locale: LessonLocale): Array<LessonOpenerStep> =>
    recordsOf(value).map((step) => ({
        who: textOf(step.who, locale),
        text: textOf(step.text, locale),
        isFault: step.fault === true,
    }))

/** The interview answer in four beats (`interview: { symptom, cause, fix, cost }`), or undefined for a one-text answer. */
const beatsOf = (
    value: unknown,
    locale: LessonLocale,
    field: string,
    issues: Issues,
): LessonOpenerInterviewBeats | undefined => {
    if (!isRecord(value) || value.symptom === undefined) return undefined
    return {
        symptom: requiredTextOf(value.symptom, locale, `${field}.symptom`, issues),
        cause: requiredTextOf(value.cause, locale, `${field}.cause`, issues),
        fix: requiredTextOf(value.fix, locale, `${field}.fix`, issues),
        cost: requiredTextOf(value.cost, locale, `${field}.cost`, issues),
    }
}

/** The development a question adds to the story (`event: { at, text }`), or undefined when the question has none. */
const eventOf = (
    question: Record<string, unknown>,
    at: string,
    locale: LessonLocale,
    issues: Issues,
): LessonOpenerEvent | undefined => {
    if (question.event === undefined) return undefined
    if (!isRecord(question.event)) {
        if (locale === "vi") issues.add(QUIZ_PATH, `${at}.event`, "is not a mapping of at and text")
        return undefined
    }
    const time = stringOf(question.event.at)
    if (locale === "vi" && !EVENT_AT.test(time))
        issues.add(QUIZ_PATH, `${at}.event.at`, `${time} is not a time like 21:03`)
    return { at: time, text: requiredTextOf(question.event.text, locale, `${at}.event.text`, issues) }
}

/** The three-part explanation of the right option (`insight: { essence, why, interview }`), or undefined when the question has none. */
const insightOf = (
    question: Record<string, unknown>,
    at: string,
    locale: LessonLocale,
    issues: Issues,
): LessonOpenerInsight | undefined => {
    if (question.insight === undefined) return undefined
    if (!isRecord(question.insight)) {
        if (locale === "vi") issues.add(QUIZ_PATH, `${at}.insight`, "is not a mapping of essence, why and interview")
        return undefined
    }
    const insight = question.insight
    const diagram = diagramOf(insight.diagram, locale, `${at}.insight.diagram`, issues)
    const code = codeOf(insight.code, locale, `${at}.insight.code`, issues)
    const beats = beatsOf(insight.interview, locale, `${at}.insight.interview`, issues)
    const happened = happenedOf(insight.happened, locale)
    const optional = (key: "fix" | "cost" | "diagramCaption"): string =>
        insight[key] === undefined ? "" : requiredTextOf(insight[key], locale, `${at}.insight.${key}`, issues)
    const fix = optional("fix")
    const cost = optional("cost")
    const diagramCaption = optional("diagramCaption")
    return {
        essence: requiredTextOf(insight.essence, locale, `${at}.insight.essence`, issues),
        // The four-beat form has no "why": Chuyện gì đã xảy ra, Cách sửa and Cái giá tell it.
        why:
            beats === undefined
                ? requiredTextOf(insight.why, locale, `${at}.insight.why`, issues)
                : textOf(insight.why, locale),
        interview:
            beats === undefined
                ? requiredTextOf(insight.interview, locale, `${at}.insight.interview`, issues)
                : [beats.symptom, beats.cause, beats.fix, beats.cost].join(" "),
        ...(beats === undefined ? {} : { interviewBeats: beats }),
        ...(happened.length === 0 ? {} : { happened }),
        ...(fix === "" ? {} : { fix }),
        ...(cost === "" ? {} : { cost }),
        ...(diagram === undefined ? {} : { diagram }),
        ...(diagramCaption === "" ? {} : { diagramCaption }),
        ...(code === undefined ? {} : { code }),
    }
}

/**
 * The demo code of a question (`insight.code: { file, lang, code, note }`): the lines of the lesson's source (or of its buggy copy) that
 * show the essence, the file they come from and one line on what to look at; released with the insight. Undefined when it has none.
 */
const codeOf = (value: unknown, locale: LessonLocale, field: string, issues: Issues): LessonOpenerCode | undefined => {
    if (value === undefined) return undefined
    if (!isRecord(value)) {
        if (locale === "vi") issues.add(QUIZ_PATH, field, "is not a mapping of file, lang, code and note")
        return undefined
    }
    const file = stringOf(value.file)
    if (locale === "vi" && !/^(source|bugs\/source)\//u.test(file))
        issues.add(QUIZ_PATH, `${field}.file`, `${file} is not a file of source/ or bugs/source/`)
    const start = typeof value.start === "number" && Number.isInteger(value.start) && value.start > 0 ? value.start : 1
    const highlight = Array.isArray(value.highlight)
        ? value.highlight.filter((line): line is number => typeof line === "number" && Number.isInteger(line))
        : []
    return {
        file,
        lang: stringOf(value.lang),
        start,
        highlight,
        code: requiredTextOf(value.code, locale, `${field}.code`, issues).replace(/\n+$/u, ""),
        note: requiredTextOf(value.note, locale, `${field}.note`, issues),
    }
}

/** The Mermaid kinds an opener figure may be: what happened in order, the parts and their paths, or the states of a row. */
const DIAGRAM_KINDS: ReadonlyArray<string> = ["sequenceDiagram", "flowchart", "stateDiagram-v2"]

/**
 * The one figure of a question (`insight.diagram`, Mermaid text released with the insight, so it never shows before the right pick), or
 * undefined when the question has none. Its first line names one of {@link DIAGRAM_KINDS}.
 */
const diagramOf = (
    value: unknown,
    locale: LessonLocale,
    field: string,
    issues: Issues,
    kinds: ReadonlyArray<string> = DIAGRAM_KINDS,
): string | undefined => {
    if (value === undefined) return undefined
    const text = textOf(value, locale).trim()
    const kind = text.split(/\s/u, 1)[0] ?? ""
    if (locale === "vi" && !kinds.includes(kind))
        issues.add(QUIZ_PATH, field, `is not Mermaid text that opens with ${kinds.join(", ")}`)
    return text === "" ? undefined : text
}

/**
 * The opener of `quiz.yaml`: five questions, one right option each, an explanation per option, a section and a scenario; with the
 * story, each question may carry the event it adds to the story and the insight its right option releases.
 */
const openerOf = (quiz: Record<string, unknown>, locale: LessonLocale, issues: Issues): Array<LessonOpenerQuestion> => {
    const questions = recordsOf(quiz.questions)
    if (locale === "vi" && questions.length !== LESSON_OPENER_SIZE)
        issues.add(QUIZ_PATH, "questions", `holds ${questions.length} questions, not ${LESSON_OPENER_SIZE}`)
    return questions.map((question, index) => {
        const at = `questions[${index}]`
        const options = recordsOf(question.options)
        const correct = options.findIndex((option) => option.correct === true)
        if (locale === "vi" && (options.length < 2 || options.filter((option) => option.correct === true).length !== 1))
            issues.add(QUIZ_PATH, `${at}.options`, "needs two options at least and exactly one correct")
        const explanations = options.map((option) => textOf(option.explanation as Localized, locale))
        const event = eventOf(question, at, locale, issues)
        const insight = insightOf(question, at, locale, issues)
        const title = question.title === undefined ? "" : requiredTextOf(question.title, locale, `${at}.title`, issues)
        const symptom =
            question.symptom === undefined ? "" : requiredTextOf(question.symptom, locale, `${at}.symptom`, issues)
        const probe = question.probe === undefined ? "" : requiredTextOf(question.probe, locale, `${at}.probe`, issues)
        const steps = textsOf(question.steps, locale)
        const technical =
            question.technical === undefined
                ? ""
                : requiredTextOf(question.technical, locale, `${at}.technical`, issues)
        const contextCaption =
            question.contextCaption === undefined
                ? ""
                : requiredTextOf(question.contextCaption, locale, `${at}.contextCaption`, issues)
        const condition =
            question.condition === undefined
                ? ""
                : requiredTextOf(question.condition, locale, `${at}.condition`, issues)
        const contextDiagram = diagramOf(question.contextDiagram, locale, `${at}.contextDiagram`, issues, ["flowchart"])
        return {
            id: stringOf(question.id),
            prompt: textOf(question.prompt as Localized, locale),
            choices: options.map((option) => textOf(option.text as Localized, locale)),
            correctIndex: Math.max(correct, 0),
            explanation: explanations[Math.max(correct, 0)] ?? "",
            choiceExplanations: explanations,
            sectionId: "1-essential",
            ...(typeof question.readSection === "string" ? { sectionRef: question.readSection } : {}),
            ...(typeof question.scenario === "string" ? { scenarioId: question.scenario } : {}),
            ...(event === undefined ? {} : { event }),
            ...(insight === undefined ? {} : { insight }),
            ...(title === "" ? {} : { title }),
            ...(symptom === "" ? {} : { symptom }),
            ...(probe === "" ? {} : { probe }),
            ...(contextDiagram === undefined ? {} : { contextDiagram }),
            ...(steps.length === 0 ? {} : { steps }),
            ...(technical === "" ? {} : { technical }),
            ...(contextCaption === "" ? {} : { contextCaption }),
            ...(condition === "" ? {} : { condition }),
        }
    })
}

/**
 * The scenarios of `scenarios.yaml`, in teaching order; the brief is also the fault the page shows. `expected` (what a correct
 * system prints, one text or `{ vi, en }`) and `invariant` (the id of the rule the scenario judges) are read when the file has them.
 */
const scenariosOf = (doc: Record<string, unknown>, locale: LessonLocale): Array<LessonScenario> =>
    recordsOf(doc.scenarios).map((scenario) => ({
        id: stringOf(scenario.id),
        title: stringOf(scenario.title),
        fault: stringOf(scenario.brief),
        brief: stringOf(scenario.brief),
        command: stringOf(scenario.command),
        expected: textOf(scenario.expected as Localized, locale),
        invariant: stringOf(scenario.invariant),
        concepts: stringsOf(scenario.concepts),
        ...(typeof scenario.cwd === "string" ? { cwd: scenario.cwd } : {}),
        ...(typeof scenario.report === "string" ? { report: scenario.report } : {}),
        ...(typeof scenario.timeoutMs === "number" ? { timeoutMs: scenario.timeoutMs } : {}),
        guards: recordsOf(scenario.guards).map((guard) => ({
            name: stringOf(guard.name),
            env: stringOf(guard.env),
            ...(typeof guard.off === "string" ? { off: guard.off } : {}),
        })),
    }))

/** The hidden scenarios of one tier: the brief from the ladder, the test file from `hidden/challenge-scenarios.yaml`. */
const hiddenOf = (
    tier: Record<string, unknown>,
    plan: Record<string, unknown> | undefined,
    locale: LessonLocale,
    byPath: ReadonlyMap<string, LessonSourceFile>,
    issues: Issues,
): Array<LessonHiddenScenario> => {
    const file = stringOf(plan?.file)
    const writeTo = stringOf(plan?.writeTo)
    if (plan !== undefined && file !== "" && !byPath.has(file))
        issues.add("hidden/challenge-scenarios.yaml", "file", `${file} is not in the folder`)
    // One test file holds every hidden scenario of a tier: it travels once, with the first scenario, so the CLI writes it once.
    return recordsOf(tier.hiddenScenarios).map((hidden, index) => {
        const id = stringOf(hidden.id)
        return {
            id,
            title: textOf(hidden.brief as Localized, locale),
            brief: textOf(hidden.brief as Localized, locale),
            concepts: stringsOf(hidden.concepts),
            // The command the ladder names (`command` of the hidden scenario) wins; without one it is the runner's own form.
            command: stringOf(hidden.command) === "" ? `npm test -- --scenario ${id}` : stringOf(hidden.command),
            ...(file === "" || writeTo === "" || index > 0 ? {} : { files: [{ path: writeTo, from: file }] }),
        }
    })
}

/** The ladder of `challenges.yaml`, with the essence answers of `hidden/essence-answers.yaml` turned into right indexes. */
const challengesOf = (
    doc: Record<string, unknown>,
    plans: Record<string, unknown> | null,
    answers: Record<string, unknown>,
    locale: LessonLocale,
    byPath: ReadonlyMap<string, LessonSourceFile>,
    issues: Issues,
): Array<LessonChallenge> =>
    recordsOf(doc.tiers).flatMap((tier, index) => {
        const level = LESSON_CHALLENGE_LEVELS.find((each) => each === tier.tier)
        if (level === undefined) {
            issues.add(
                "sections/4-apply/challenges.yaml",
                `tiers[${index}].tier`,
                "is not easy, medium, hard or insane",
            )
            return []
        }
        const plan = recordsOf(plans?.tiers).find((each) => each.tier === level)
        const rubric = recordsOf(tier.rubric).map((criterion) => ({
            id: stringOf(criterion.id),
            criterion: textOf(criterion.criterion as Localized, locale),
            points: typeof criterion.score === "number" ? criterion.score : 0,
            ...(criterion.critical === true ? { isCritical: true } : {}),
        }))
        const total = rubric.reduce((sum, criterion) => sum + criterion.points, 0)
        if (locale === "vi" && total !== LESSON_CHALLENGE_POINTS)
            issues.add("sections/4-apply/challenges.yaml", `tiers[${index}].rubric`, `adds up to ${total}, not 100`)
        const questions = recordsOf(tier.essence).map((question): LessonOpenerQuestion => {
            const options = recordsOf(question.options)
            const answer = answers[stringOf(question.id)]
            const correct = options.findIndex((option) => option.id === answer)
            if (locale === "vi" && correct < 0)
                issues.add("hidden/essence-answers.yaml", stringOf(question.id), "names no option of the question")
            if (
                question.writtenRequired !== undefined &&
                typeof question.writtenRequired !== "boolean" &&
                locale === "vi"
            )
                issues.add(
                    "sections/4-apply/challenges.yaml",
                    `tiers[${index}].essence.${stringOf(question.id)}.writtenRequired`,
                    "is not true or false",
                )
            return {
                id: stringOf(question.id),
                prompt: textOf(question.prompt as Localized, locale),
                choices: options.map((option) => textOf(option.text as Localized, locale)),
                correctIndex: Math.max(correct, 0),
                explanation: "",
                ...(tier.writtenRequired === true || question.writtenRequired === true
                    ? { writtenRequired: true }
                    : {}),
            }
        })
        if (tier.writtenRequired !== undefined && typeof tier.writtenRequired !== "boolean" && locale === "vi")
            issues.add("sections/4-apply/challenges.yaml", `tiers[${index}].writtenRequired`, "is not true or false")
        if (tier.writtenRequired === true && questions.length === 0 && locale === "vi")
            issues.add(
                "sections/4-apply/challenges.yaml",
                `tiers[${index}].writtenRequired`,
                "asks a written explanation of the essence questions, but the tier has none",
            )
        const challenge: LessonChallenge = {
            id: level,
            level: level as LessonChallengeLevel,
            title: textOf(tier.title as Localized, locale),
            brief: textOf((tier.contract ?? tier.title) as Localized, locale),
            rubric,
            hidden: hiddenOf(tier, plan, locale, byPath, issues),
            questions,
            ...(questions.some((question) => question.writtenRequired === true) ? { writtenRequired: true } : {}),
        }
        return [challenge]
    })

/** The path of the bug pack's tests. */
const BUGS_PATH = "bugs/tests.yaml"

/** The schema the bug pack's tests file names. */
const BUGS_SCHEMA = "starci-next-seed-standard/essentials-bugs@1"

/** The path of the Pattern stacks. */
const PATTERNS_PATH = "sections/5-patterns/patterns.yaml"

/** The schema the Pattern file names. */
const PATTERNS_SCHEMA = "starci-next-seed-standard/essentials-patterns@1"

/** The stacks Pattern knows. */
const PATTERN_STACKS: ReadonlyArray<string> = ["nestjs", "go", "spring", "dotnet"]

/** The most hints a bug-pack test gives: direction, file, line. */
const BUG_HINTS_MAX = 3

/** An id of a test: lowercase letters, digits and dashes. */
const SLUG_ID = /^[a-z0-9][a-z0-9-]{0,63}$/u

/** A path the learner CLI takes: relative, posix, no drive. */
const RUN_PATH = /^[A-Za-z0-9._@-][A-Za-z0-9._@/-]*$/u

/** A GitHub repository as `owner/name`. */
const GITHUB_REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u

/** The text of a localized field, with an issue on the vi pass when it is empty. */
const neededTextOf = (value: unknown, locale: LessonLocale, path: string, field: string, issues: Issues): string => {
    const text = textOf(value as Localized, locale)
    if (locale === "vi" && text.trim() === "") issues.add(path, field, "is empty")
    return text
}

/** The schema line of a file, with an issue when it names another schema (a file without one is read as this schema). */
const checkSchema = (doc: Record<string, unknown>, path: string, schema: string, issues: Issues): void => {
    if (doc.schema !== undefined && doc.schema !== schema)
        issues.add(path, "schema", `is ${String(doc.schema)}, not ${schema}`)
}

/** The issues of the vi pass only: a structural check is reported once, not once per locale. */
const viIssues = (locale: LessonLocale, issues: Issues): Issues => (locale === "vi" ? issues : new Issues())

/** The final test of a pack: the one marked `final: true`, else the last of several; -1 when none. */
const finalIndexOf = (entries: ReadonlyArray<Record<string, unknown>>): number => {
    const marked = entries.findIndex((entry) => entry.final === true)
    if (marked >= 0) return marked
    return entries.length > 1 ? entries.length - 1 : -1
}

/** One test of the bug pack, field by field, with the issues of its own fields. */
const bugTestOf = (
    entry: Record<string, unknown>,
    index: number,
    isFinal: boolean,
    opener: ReadonlyArray<LessonOpenerQuestion>,
    locale: LessonLocale,
    issues: Issues,
): LessonBugTest => {
    const vi = viIssues(locale, issues)
    const at = `tests[${index}]`
    const id = stringOf(entry.id)
    if (!SLUG_ID.test(id)) vi.add(BUGS_PATH, `${at}.id`, `${id} is not an id like ack-lost-retry`)
    const command = stringOf(entry.command)
    if (command.trim() === "") vi.add(BUGS_PATH, `${at}.command`, "is empty")
    const essence = typeof entry.essence === "string" ? entry.essence : null
    if (entry.essence !== undefined && entry.essence !== null && typeof entry.essence !== "string")
        vi.add(BUGS_PATH, `${at}.essence`, "is not an opener question id or null")
    if (essence !== null && !opener.some((question) => question.id === essence))
        vi.add(BUGS_PATH, `${at}.essence`, `${essence} is not a question of ${QUIZ_PATH}`)
    if (entry.hints !== undefined && !Array.isArray(entry.hints)) vi.add(BUGS_PATH, `${at}.hints`, "is not a list")
    const hints: ReadonlyArray<unknown> = Array.isArray(entry.hints) ? entry.hints : []
    if (hints.length > BUG_HINTS_MAX)
        vi.add(BUGS_PATH, `${at}.hints`, `holds ${hints.length} hints, not ${BUG_HINTS_MAX} at most`)
    if (hints.length === 0 && !isFinal) vi.add(BUGS_PATH, `${at}.hints`, "holds no hint")
    // The learner CLI refuses a path above the folder and an id it cannot name, so the importer refuses them first.
    for (const field of ["cwd", "report"] as const) {
        const value = entry[field]
        if (
            value !== undefined &&
            (typeof value !== "string" || !RUN_PATH.test(value) || value.split("/").includes(".."))
        )
            vi.add(BUGS_PATH, `${at}.${field}`, `${String(value)} is not a relative path`)
    }
    stringsOf(entry.concepts)
        .filter((concept) => !SLUG_ID.test(concept))
        .forEach((concept) => vi.add(BUGS_PATH, `${at}.concepts`, `${concept} is not [a-z0-9-]+`))
    return {
        id,
        command,
        essence,
        title: neededTextOf(entry.title, locale, BUGS_PATH, `${at}.title`, issues),
        pass: neededTextOf(entry.pass, locale, BUGS_PATH, `${at}.pass`, issues),
        fail: neededTextOf(entry.fail, locale, BUGS_PATH, `${at}.fail`, issues),
        expected: textOf(entry.expected as Localized, locale),
        received: textOf(entry.received as Localized, locale),
        hints: hints.map((hint, place) => neededTextOf(hint, locale, BUGS_PATH, `${at}.hints[${place}]`, issues)),
        isFinal,
        concepts: stringsOf(entry.concepts),
        ...(typeof entry.cwd === "string" ? { cwd: entry.cwd } : {}),
        ...(typeof entry.report === "string" ? { report: entry.report } : {}),
        ...(typeof entry.timeoutMs === "number" ? { timeoutMs: entry.timeoutMs } : {}),
    }
}

/**
 * The bug pack of Tìm sạn (`bugs/tests.yaml`, essentials-bugs@1), or null when the lesson has none: a lesson written before it
 * still imports. Every test needs an id (once), a command, a title, `pass` and `fail` texts and up to three hints (at least one,
 * but for the final test); `essence` names an opener question or is null. The final test is the one marked `final: true`, else
 * the last of several. The buggy source (`bugs/source/`) must come with the tests, and the tests with it.
 */
const bugsOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    opener: ReadonlyArray<LessonOpenerQuestion>,
    locale: LessonLocale,
    issues: Issues,
): LessonBugPack | null => {
    const vi = viIssues(locale, issues)
    const hasSource = [...byPath.keys()].some((path) => path.startsWith(BUGS_FOLDER))
    if (!byPath.has(BUGS_PATH)) {
        if (hasSource) vi.add(BUGS_FOLDER, "", `has no ${BUGS_PATH}`)
        return null
    }
    const doc = yamlOf(byPath, BUGS_PATH, vi)
    if (doc === null) return null
    checkSchema(doc, BUGS_PATH, BUGS_SCHEMA, vi)
    if (!hasSource) vi.add(BUGS_PATH, "", `comes without ${BUGS_FOLDER}`)
    const entries = recordsOf(doc.tests)
    if (entries.length === 0) vi.add(BUGS_PATH, "tests", "holds no test")
    const marked = entries.filter((entry) => entry.final === true).length
    if (marked > 1) vi.add(BUGS_PATH, "tests", `marks ${marked} tests final, not one`)
    const finalIndex = finalIndexOf(entries)
    const tests = entries.map((entry, index) => bugTestOf(entry, index, index === finalIndex, opener, locale, issues))
    tests.forEach((test, index) => {
        if (tests.findIndex((each) => each.id === test.id) !== index)
            vi.add(BUGS_PATH, `tests[${index}].id`, `${test.id} is listed twice`)
    })
    return { tests }
}

/** The `owner/name` of a GitHub repository named as `owner/name`, `github.com/owner/name` or its https address. */
const repoOf = (raw: string): string =>
    raw
        .trim()
        .replace(/^https?:\/\//u, "")
        .replace(/^github\.com\//u, "")
        .replace(/\.git$/u, "")
        .replace(/\/$/u, "")

/** One Pattern stack, field by field, with the issues of its own fields. */
const patternOf = (
    entry: Record<string, unknown>,
    index: number,
    locale: LessonLocale,
    issues: Issues,
): LessonPattern => {
    const vi = viIssues(locale, issues)
    const at = `patterns[${index}]`
    const stack = stringOf(entry.stack)
    if (!PATTERN_STACKS.includes(stack))
        vi.add(PATTERNS_PATH, `${at}.stack`, `${stack} is not one of ${PATTERN_STACKS.join(", ")}`)
    const status = LESSON_PATTERN_STATUSES.find((each) => each === entry.status) ?? "soon"
    if (entry.status !== status) vi.add(PATTERNS_PATH, `${at}.status`, "is not ready or soon")
    const isReady = status === "ready"
    const repo = repoOf(stringOf(entry.repo))
    if (repo !== "" && !GITHUB_REPO.test(repo))
        vi.add(PATTERNS_PATH, `${at}.repo`, `${repo} is not a GitHub owner/name`)
    if (isReady && repo === "") vi.add(PATTERNS_PATH, `${at}.repo`, "is empty for a ready stack")
    const folder = stringOf(entry.path).replace(/^\/+|\/+$/gu, "")
    if (folder.split("/").includes("..")) vi.add(PATTERNS_PATH, `${at}.path`, "leaves the repository")
    const answer = (field: "where" | "howFar" | "whenDown"): string =>
        isReady
            ? neededTextOf(entry[field], locale, PATTERNS_PATH, `${at}.${field}`, issues)
            : textOf(entry[field] as Localized, locale)
    const files = recordsOf(entry.files).map((file): LessonPatternFile => ({
        path: stringOf(file.path),
        note: textOf(file.note as Localized, locale),
    }))
    if (isReady && files.length === 0) vi.add(PATTERNS_PATH, `${at}.files`, "is empty for a ready stack")
    files.forEach((file, place) => {
        if (file.path.trim() === "") vi.add(PATTERNS_PATH, `${at}.files[${place}].path`, "is empty")
    })
    const snippet = isRecord(entry.snippet)
        ? {
              lang: stringOf(entry.snippet.lang),
              file: stringOf(entry.snippet.file),
              code: stringOf(entry.snippet.code),
          }
        : null
    if (snippet !== null && snippet.code.trim() === "") vi.add(PATTERNS_PATH, `${at}.snippet.code`, "is empty")
    return {
        stack,
        status,
        repo,
        path: folder,
        where: answer("where"),
        howFar: answer("howFar"),
        whenDown: answer("whenDown"),
        files,
        snippet,
    }
}

/**
 * The Pattern stacks (`sections/5-patterns/patterns.yaml`, essentials-patterns@1, the list under `patterns`), or undefined when the
 * lesson has no file. A stack is one of nestjs, go, spring and dotnet, listed once; a ready one needs its repository, the three
 * answers and its files.
 */
const patternsOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    locale: LessonLocale,
    issues: Issues,
): ReadonlyArray<LessonPattern> | undefined => {
    if (!byPath.has(PATTERNS_PATH)) return undefined
    const vi = viIssues(locale, issues)
    const doc = yamlOf(byPath, PATTERNS_PATH, vi)
    if (doc === null) return []
    checkSchema(doc, PATTERNS_PATH, PATTERNS_SCHEMA, vi)
    const entries = recordsOf(doc.patterns)
    if (entries.length === 0) vi.add(PATTERNS_PATH, "patterns", "holds no stack")
    const patterns = entries.map((entry, index) => patternOf(entry, index, locale, issues))
    patterns.forEach((pattern, index) => {
        if (patterns.findIndex((each) => each.stack === pattern.stack) !== index)
            vi.add(PATTERNS_PATH, `patterns[${index}].stack`, `${pattern.stack} is listed twice`)
    })
    return patterns
}

/** The glossary and self-checks of the Bản chất reading. */
const READING_PATH = "sections/2-essence/reading.yaml"

/** The id of a glossary term or a self-check: lower-case words joined by dashes. */
const READING_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

/**
 * The glossary and the self-checks of the reading (`sections/2-essence/reading.yaml`, essentials-reading@1), or null when the lesson
 * has none. A check is an opener-shaped choice question (one right option, a reason per option) that names the `## N.` chapter it
 * closes; its key stays on the server and is graded one pick at a time like the opener.
 */
const readingOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    locale: LessonLocale,
    issues: Issues,
): LessonReading | null => {
    if (!byPath.has(READING_PATH)) return null
    const doc = yamlOf(byPath, READING_PATH, issues) ?? {}
    const glossary = recordsOf(doc.glossary).map((entry, index) => {
        const id = stringOf(entry.id)
        if (locale === "vi" && !READING_ID.test(id)) issues.add(READING_PATH, `glossary[${index}].id`, "is not an id")
        const term = textOf(entry.term as Localized, locale)
        const definition = textOf(entry.definition as Localized, locale)
        if (locale === "vi" && (term.trim() === "" || definition.trim() === ""))
            issues.add(READING_PATH, `glossary[${index}]`, "needs a term and a definition")
        return { id, term, definition }
    })
    const checks = recordsOf(doc.checks).map((check, index): LessonReadingCheck => {
        const at = `checks[${index}]`
        const id = stringOf(check.id)
        if (locale === "vi" && !READING_ID.test(id)) issues.add(READING_PATH, `${at}.id`, "is not an id")
        const chapter = typeof check.chapter === "number" ? String(check.chapter) : stringOf(check.chapter)
        if (locale === "vi" && !/^\d+$/u.test(chapter)) issues.add(READING_PATH, `${at}.chapter`, "is not a chapter number")
        const options = recordsOf(check.options)
        const correct = options.findIndex((option) => option.correct === true)
        if (locale === "vi" && (options.length < 2 || options.filter((option) => option.correct === true).length !== 1))
            issues.add(READING_PATH, `${at}.options`, "needs two options at least and exactly one correct")
        const explanations = options.map((option) => textOf(option.explanation as Localized, locale))
        return {
            id,
            chapter,
            prompt: textOf(check.prompt as Localized, locale),
            choices: options.map((option) => textOf(option.text as Localized, locale)),
            correctIndex: Math.max(correct, 0),
            explanation: explanations[Math.max(correct, 0)] ?? "",
            choiceExplanations: explanations,
            sectionId: LESSON_ESSENCE_SECTION,
            sectionRef: chapter,
        }
    })
    for (const [field, ids] of [
        ["glossary", glossary.map((entry) => entry.id)],
        ["checks", checks.map((check) => check.id)],
    ] as const)
        ids.forEach((id, index) => {
            if (locale === "vi" && ids.indexOf(id) !== index) issues.add(READING_PATH, field, `id ${id} appears twice`)
        })
    return { glossary, checks }
}

/** The four-part fields of one locale. */
const essentialOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    locale: LessonLocale,
    issues: Issues,
): LessonEssential => {
    const quiz = yamlOf(byPath, QUIZ_PATH, issues) ?? {}
    const scenarios = yamlOf(byPath, "scenarios.yaml", issues) ?? {}
    const ladder = byPath.has("sections/4-apply/challenges.yaml")
        ? yamlOf(byPath, "sections/4-apply/challenges.yaml", issues)
        : null
    const plans = byPath.has("hidden/challenge-scenarios.yaml")
        ? yamlOf(byPath, "hidden/challenge-scenarios.yaml", issues)
        : null
    const answers = byPath.has("hidden/essence-answers.yaml")
        ? yamlOf(byPath, "hidden/essence-answers.yaml", issues)
        : null
    const source = isRecord(scenarios.source) ? scenarios.source : {}
    const publicInvariants = isRecord(scenarios.invariants) ? scenarios.invariants : {}
    // The laws only the hidden challenge scenarios judge stay out of the public list: their names hint at the hidden tests.
    const hiddenInvariants = Object.entries(isRecord(plans?.invariants) ? plans.invariants : {}).filter(
        ([id]) => !Object.hasOwn(publicInvariants, id),
    )
    const opener = openerOf(quiz, locale, issues)
    const bugs = bugsOf(byPath, opener, locale, issues)
    const patterns = patternsOf(byPath, locale, issues)
    const reading = readingOf(byPath, locale, issues)
    return {
        story: storyOf(quiz, locale, issues),
        opener,
        source: {
            langs: ["typescript"],
            ...(typeof source.dir === "string" ? { dir: source.dir } : {}),
            ...(typeof source.compose === "string" ? { compose: source.compose } : {}),
            ...(typeof source.project === "string" ? { project: source.project } : {}),
        },
        invariants: Object.entries(publicInvariants).map(([id, text]) => ({ id, text: stringOf(text) })),
        hiddenInvariants: hiddenInvariants.map(([id, text]) => ({ id, text: stringOf(text) })),
        architecture: null,
        codeWalk: [],
        scenarios: scenariosOf(scenarios, locale),
        challenges:
            ladder === null
                ? []
                : challengesOf(
                      ladder,
                      plans,
                      isRecord(answers?.answers) ? answers.answers : {},
                      locale,
                      byPath,
                      issues,
                  ),
        ...(bugs === null ? {} : { bugs }),
        ...(patterns === undefined ? {} : { patterns }),
        ...(reading === null ? {} : { reading }),
    }
}

/** The hidden test sources attached to the challenges, from the folder. */
const withHiddenTexts = (
    essential: LessonEssential,
    byPath: ReadonlyMap<string, LessonSourceFile>,
): LessonEssential => ({
    ...essential,
    challenges: essential.challenges.map((challenge) => ({
        ...challenge,
        hidden: (challenge.hidden ?? []).map((hidden) => ({
            ...hidden,
            files: (hidden.files ?? []).map((file) => ({ ...file, content: byPath.get(file.from)?.text ?? "" })),
        })),
    })),
})

/** The four part sections of one locale, from `sections/<part>/<locale>.md`. */
const sectionsOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    locale: LessonLocale,
    issues: Issues,
): Array<LessonSection> => [
    ...PART_SECTIONS.flatMap((part, index) => {
        const fields = fieldsOf(byPath, `sections/${part.id}/${locale}.md`, issues)
        if (fields === null) return []
        return [
            {
                id: part.id,
                title: fields.title ?? part.id,
                phase: part.phase,
                sortIndex: index + 1,
                body: fields.body ?? "",
            },
        ]
    }),
    ...essenceSectionOf(byPath, locale, issues),
]

/**
 * The practice-led Bản chất reading (`sections/2-essence/<locale>.md`, separator fields), or none for a lesson written before it.
 * When one locale has it, both need it. It sorts after the four part sections and is read under the `2-source` part.
 */
const essenceSectionOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    locale: LessonLocale,
    issues: Issues,
): Array<LessonSection> => {
    const path = `sections/${LESSON_ESSENCE_SECTION}/${locale}.md`
    if (!LESSON_LOCALES.some((each) => byPath.has(`sections/${LESSON_ESSENCE_SECTION}/${each}.md`))) return []
    const fields = fieldsOf(byPath, path, issues)
    if (fields === null) return []
    if ((fields.body ?? "").trim() === "") issues.add(path, "body", "is empty")
    return [
        {
            id: LESSON_ESSENCE_SECTION,
            title: fields.title ?? LESSON_ESSENCE_SECTION,
            phase: "explore",
            sortIndex: PART_SECTIONS.length + 1,
            body: fields.body ?? "",
        },
    ]
}

/** A whole number field, or the fallback. */
const numberOf = (raw: string | undefined, fallback: number): number =>
    raw !== undefined && /^\d+$/u.test(raw.trim()) ? Number(raw.trim()) : fallback

/** The difficulty a root names, or intermediate. */
const difficultyOf = (raw: string | undefined): LessonDifficulty =>
    raw === "foundation" || raw === "advanced" ? raw : "intermediate"

/** The stored document of one locale. */
const documentOf = (
    fields: Readonly<Record<string, string>>,
    sections: Array<LessonSection>,
    essential: LessonEssential,
): LessonLocaleDocument => ({
    title: fields.title ?? "",
    description: fields.description ?? "",
    body: fields.body ?? "",
    ...(fields.isPremium === "true" || fields.isPremium === "false" ? { isPremium: fields.isPremium === "true" } : {}),
    learningOutcomes: [],
    prerequisites: [],
    references: [],
    retrieval: [],
    sections,
    essential,
})

/** The structural lines two locales must share: question shapes, scenario ids and commands, rubric points. */
const structureOf = (essential: LessonEssential, sections: ReadonlyArray<LessonSection>): Array<string> => [
    ...sections.map((section) => `section ${section.id}`),
    ...essential.opener.map(
        (question) =>
            `q ${question.id} ${question.choices.length} ${question.correctIndex} ${question.event?.at ?? ""} ${String(question.insight !== undefined)} ${String(question.insight?.diagram !== undefined)} ${question.insight?.code?.file ?? ""} ${String(question.title !== undefined)}`,
    ),
    `story ${String(essential.story !== null && essential.story !== undefined)}`,
    ...essential.challenges.flatMap((challenge) => [
        `c ${challenge.id} ${challenge.rubric.map((criterion) => criterion.points).join(",")}`,
        ...(challenge.questions ?? []).map(
            (question) => `e ${question.id} ${question.choices.length} ${String(question.writtenRequired === true)}`,
        ),
        `w ${challenge.id} ${String(challenge.writtenRequired === true)}`,
    ]),
    ...(essential.bugs?.tests ?? []).map(
        (test) => `bug ${test.id} ${test.command} ${test.essence ?? ""} ${test.hints.length} ${String(test.isFinal)}`,
    ),
    ...(essential.patterns ?? []).map(
        (pattern) =>
            `pattern ${pattern.stack} ${pattern.status} ${pattern.repo} ${pattern.path} ${pattern.files.map((file) => file.path).join(",")}`,
    ),
]

/**
 * Converts one lesson folder of the topic-based format into the draft the importer stores: both locales with the four part
 * sections and the four-part fields, the `source/` code (only it; `hidden/` stays server-side as the hidden scenarios' files and
 * the right answers), the topic from the folder and the hashes of every file. Answers the issues instead when any blocks it.
 */
export const convertRawLesson = (input: RawLessonInput, catalog: LessonTopicCatalog): LessonDraftResult => {
    const issues = new Issues()
    const byPath = new Map(input.files.map((file) => [file.path, file]))
    const roots = Object.fromEntries(LESSON_LOCALES.map((locale) => [locale, fieldsOf(byPath, `${locale}.md`, issues)]))
    const docs = Object.fromEntries(
        LESSON_LOCALES.map((locale) => {
            const essential = withHiddenTexts(essentialOf(byPath, locale, issues), byPath)
            return [locale, { essential, sections: sectionsOf(byPath, locale, issues) }]
        }),
    ) as Record<LessonLocale, { readonly essential: LessonEssential; readonly sections: Array<LessonSection> }>
    const scenarioDoc = yamlOf(new Map(byPath), "scenarios.yaml", new Issues())
    if (scenarioDoc !== null && scenarioDoc.lessonId !== undefined && scenarioDoc.lessonId !== input.folder)
        issues.add("scenarios.yaml", "lessonId", `is ${String(scenarioDoc.lessonId)}, the folder is ${input.folder}`)
    // The topic is content: `<topic>/topic.yaml` first, the catalog of the code for a topic that has no file.
    const topicFile = input.topicFile === undefined || input.topicFile === null ? null : topicSourceOf(input.topicFile)
    if (topicFile?.issue !== undefined && topicFile.issue !== null) issues.add("topic.yaml", "", topicFile.issue)
    const topicSource = topicFile?.source ?? catalog.topics[input.topic]
    if (topicSource === undefined && topicFile === null) issues.add("", "topic", `topic ${input.topic} is not defined`)
    const viLines = structureOf(docs.vi.essential, docs.vi.sections)
    const enLines = new Set(structureOf(docs.en.essential, docs.en.sections))
    viLines
        .filter((line) => !enLines.has(line))
        .forEach((line) => issues.add("en", "", `differs from vi: lacks "${line}"`))
    const vi = roots.vi
    const en = roots.en
    const category = vi?.category ?? "backend"
    const group = groupOf(input.folder, category)
    if (group === null) issues.add("vi.md", "category", `category ${category} has no group`)
    if (issues.list.length > 0 || vi === null || en === null || vi === undefined || en === undefined) {
        return { draft: null, issues: issues.list }
    }
    if (topicSource === undefined || group === null) return { draft: null, issues: issues.list }
    const sourceCode = sourceCodeOf(input.files)
    const bugsCode = sourceCodeOf(input.files, BUGS_FOLDER)
    const content: LessonContent = {
        locales: {
            vi: documentOf(vi, docs.vi.sections, docs.vi.essential),
            en: documentOf(en, docs.en.sections, docs.en.essential),
        },
        workspace: null,
        files: [],
        ...(sourceCode.length === 0 ? {} : { sourceCode }),
        ...(bugsCode.length === 0 ? {} : { bugsCode }),
    }
    return {
        draft: {
            id: input.folder,
            category,
            group,
            topic: input.topic,
            topicSource,
            sourceKey: null,
            difficulty: difficultyOf(vi.difficulty),
            minutesRead: numberOf(vi.minutesRead, 30),
            implementation: "typescript",
            sortIndex: numberOf(vi.sortIndex, 0),
            content,
            sourceHashes: Object.fromEntries(
                [...input.files]
                    .sort((a, b) => a.path.localeCompare(b.path))
                    .map((file): [string, string] => [file.path, file.sha256]),
            ),
            contentHash: contentHashOf(input.files),
        },
        issues: [],
    }
}
