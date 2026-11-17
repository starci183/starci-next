import { parse } from "yaml"
import { isRecord } from "@modules/platform/primitives"
import { contentHashOf } from "./lesson-draft.policy"
import { groupOf } from "./lesson-group.policy"
import { parseSeparatorFields } from "./separator.policy"
import { sourceCodeOf } from "./lesson-source-archive.policy"
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
    type LessonChallenge,
    type LessonChallengeLevel,
    type LessonEssential,
    type LessonHiddenScenario,
    type LessonOpenerQuestion,
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

/** The opener of `quiz.yaml`: five questions, one right option each, an explanation per option, a section and a scenario. */
const openerOf = (quiz: Record<string, unknown>, locale: LessonLocale, issues: Issues): Array<LessonOpenerQuestion> => {
    const path = "sections/1-essential/quiz.yaml"
    const questions = recordsOf(quiz.questions)
    if (locale === "vi" && questions.length !== LESSON_OPENER_SIZE)
        issues.add(path, "questions", `holds ${questions.length} questions, not ${LESSON_OPENER_SIZE}`)
    return questions.map((question, index) => {
        const options = recordsOf(question.options)
        const correct = options.findIndex((option) => option.correct === true)
        if (locale === "vi" && (options.length < 2 || options.filter((option) => option.correct === true).length !== 1))
            issues.add(path, `questions[${index}].options`, "needs two options at least and exactly one correct")
        const explanations = options.map((option) => textOf(option.explanation as Localized, locale))
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
            return {
                id: stringOf(question.id),
                prompt: textOf(question.prompt as Localized, locale),
                choices: options.map((option) => textOf(option.text as Localized, locale)),
                correctIndex: Math.max(correct, 0),
                explanation: "",
            }
        })
        const challenge: LessonChallenge = {
            id: level,
            level: level as LessonChallengeLevel,
            title: textOf(tier.title as Localized, locale),
            brief: textOf((tier.contract ?? tier.title) as Localized, locale),
            rubric,
            hidden: hiddenOf(tier, plan, locale, byPath, issues),
            questions,
        }
        return [challenge]
    })

/** The four-part fields of one locale. */
const essentialOf = (
    byPath: ReadonlyMap<string, LessonSourceFile>,
    locale: LessonLocale,
    issues: Issues,
): LessonEssential => {
    const quiz = yamlOf(byPath, "sections/1-essential/quiz.yaml", issues) ?? {}
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
    return {
        opener: openerOf(quiz, locale, issues),
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
): Array<LessonSection> =>
    PART_SECTIONS.flatMap((part, index) => {
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
    })

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
    ...essential.opener.map((question) => `q ${question.id} ${question.choices.length} ${question.correctIndex}`),
    ...essential.challenges.flatMap((challenge) => [
        `c ${challenge.id} ${challenge.rubric.map((criterion) => criterion.points).join(",")}`,
        ...(challenge.questions ?? []).map((question) => `e ${question.id} ${question.choices.length}`),
    ]),
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
    const content: LessonContent = {
        locales: {
            vi: documentOf(vi, docs.vi.sections, docs.vi.essential),
            en: documentOf(en, docs.en.sections, docs.en.essential),
        },
        workspace: null,
        files: [],
        ...(sourceCode.length === 0 ? {} : { sourceCode }),
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
