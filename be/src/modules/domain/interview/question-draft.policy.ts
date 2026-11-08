import { isRecord } from "@modules/platform/primitives"
import {
    addIssue,
    booleanOf,
    choiceOf,
    integerOf,
    objectListOf,
    optionalTextOf,
    readerOf,
    textListOf,
    textOf,
    type FileReader,
} from "./field-read.policy"
import {
    SKIPPED_KINDS,
    STAR_KEYS,
    TECHNICAL_DIMENSIONS,
    type ChecklistItem,
    type ExampleResult,
    type GradingMaterial,
    type InterviewFamily,
    type InterviewIssue,
    type InterviewLocale,
    type InterviewTier,
    type InterviewerMaterial,
    type QuestionDraft,
    type QuestionPrompt,
    type StarKey,
    type StarRubricLine,
} from "./interview.contracts"
import { givesAwayAnswer, groundOf, stemOf } from "./stem.policy"

/** The source files of one question folder by posix path relative to the bank folder. */
export type QuestionTexts = ReadonlyMap<string, string>

/** What reading one question folder gave. */
export type QuestionOutcome =
    | { readonly kind: "draft"; readonly draft: QuestionDraft }
    | { readonly kind: "skipped" }
    | { readonly kind: "invalid" }

const SCORE_TOTAL = 100

/** The fields both families share, read from one locale file. */
interface Meta {
    readonly sortIndex: number
    readonly isPremium: boolean
    readonly family: InterviewFamily
    readonly tier: InterviewTier
    readonly kind: string
    readonly tags: ReadonlyArray<string>
}

const metaOf = (reader: FileReader): Meta => ({
    sortIndex: integerOf(reader, "sortIndex"),
    isPremium: booleanOf(reader, "isPremium"),
    family: choiceOf<InterviewFamily>(reader, "family", ["technical", "behavioral"]),
    tier: choiceOf<InterviewTier>(reader, "tier", ["junior", "middle", "senior"]),
    kind: textOf(reader, "kind"),
    tags: textListOf(reader, "tags"),
})

const checklistOf = (reader: FileReader): ReadonlyArray<ChecklistItem> => {
    const items = objectListOf(reader, "checklist").map((item, index): ChecklistItem => {
        const at = `checklist[${index}]`
        const dimension = TECHNICAL_DIMENSIONS.find((candidate) => candidate === item["dimension"]?.trim())
        if (dimension === undefined)
            addIssue(reader, `${at}.dimension`, `expected one of ${TECHNICAL_DIMENSIONS.join(", ")}`)
        const critical = item["critical"]?.trim()
        if (critical !== "true" && critical !== "false") addIssue(reader, `${at}.critical`, "expected true or false")
        const band = item["scoreBand"]?.trim() ?? ""
        if (!/^\d+$/u.test(band)) addIssue(reader, `${at}.scoreBand`, "expected a whole number")
        if ((item["text"] ?? "").trim() === "") addIssue(reader, `${at}.text`, "is missing or empty")
        return {
            text: (item["text"] ?? "").trim(),
            dimension: dimension ?? "technical",
            critical: critical === "true",
            scoreBand: /^\d+$/u.test(band) ? Number(band) : 0,
        }
    })
    const total = items.reduce((sum, item) => sum + item.scoreBand, 0)
    if (items.length === 0) addIssue(reader, "checklist", "is missing or empty")
    else if (total !== SCORE_TOTAL)
        addIssue(reader, "checklist", `score bands sum to ${total}, expected ${SCORE_TOTAL}`)
    return items
}

const scoreOf = (value: unknown): number | null | undefined => {
    if (value === null) return null
    return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

const exampleOf = (entry: unknown): ExampleResult | null => {
    if (!isRecord(entry)) return null
    const { level, answer, sonnet, haiku } = entry
    const first = scoreOf(sonnet)
    const second = scoreOf(haiku)
    if (typeof level !== "number" || typeof answer !== "string" || answer.trim() === "") return null
    if (first === undefined || second === undefined) return null
    return { level, answer, sonnet: first, haiku: second }
}

/** Records that the example results are not JSON; there are none to keep. */
const unreadableExamples = (reader: FileReader, cause: unknown): ReadonlyArray<ExampleResult> => {
    addIssue(reader, "exampleResults", `is not valid json: ${String(cause)}`)
    return []
}

const examplesOf = (reader: FileReader): ReadonlyArray<ExampleResult> => {
    const raw = textOf(reader, "exampleResults")
    if (raw === "") return []
    try {
        const parsed: unknown = JSON.parse(raw)
        const entries = Array.isArray(parsed) ? parsed.map((entry) => exampleOf(entry)) : []
        const valid = entries.flatMap((entry) => (entry === null ? [] : [entry]))
        if (valid.length === 0 || valid.length !== entries.length) {
            addIssue(reader, "exampleResults", "expected a list of {level, answer, sonnet, haiku}")
            return []
        }
        return valid
    } catch (cause) {
        return unreadableExamples(reader, cause)
    }
}

/** Everything a technical locale file holds. */
interface TechnicalLocale {
    readonly meta: Meta
    readonly diagram: string | null
    readonly interviewer: InterviewerMaterial
    readonly grading: GradingMaterial
}

const technicalLocaleOf = (reader: FileReader): TechnicalLocale => ({
    meta: metaOf(reader),
    diagram: optionalTextOf(reader, "diagram"),
    interviewer: { followUps: textListOf(reader, "followUps"), hints: textListOf(reader, "hints") },
    grading: {
        rubric: textListOf(reader, "rubric"),
        checklist: checklistOf(reader),
        keywords: textListOf(reader, "keywords"),
        star: [],
        ownershipSignal: null,
        exampleResults: examplesOf(reader),
    },
})

/** The prompt, code and ideal answer of one body locale file. */
interface BodyLocale {
    readonly lang: string
    readonly prompt: QuestionPrompt
    readonly idealAnswer: string
}

const bodyLocaleOf = (reader: FileReader, diagram: string | null): BodyLocale => ({
    lang: textOf(reader, "lang"),
    prompt: { prompt: textOf(reader, "prompt"), givenCode: optionalTextOf(reader, "givenCode"), diagram },
    idealAnswer: textOf(reader, "idealAnswer"),
})

/** Reads the vi and en files of a question folder with one reader each. */
const localesOf = <T>(
    here: string,
    texts: QuestionTexts,
    issues: Array<InterviewIssue>,
    build: (reader: FileReader) => T,
): readonly [T, T] => {
    const read = (locale: InterviewLocale): T =>
        build(readerOf(`${here}/${locale}.md`, texts.get(`${locale}.md`) ?? "", issues))
    return [read("vi"), read("en")]
}

/** The folder names of the bodies of a question, by the prefix `bodies/`. */
const bodyFoldersOf = (texts: QuestionTexts): ReadonlyArray<string> => {
    const names = [...texts.keys()].flatMap((path) => /^bodies\/([^/]+)\/(?:vi|en)\.md$/u.exec(path)?.[1] ?? [])
    return [...new Set(names)].sort((a, b) => a.localeCompare(b))
}

const same = (issues: Array<InterviewIssue>, path: string, field: string, ok: boolean): void => {
    if (!ok) issues.push({ path, field, message: "differs between vi and en" })
}

const parityOf = (path: string, vi: TechnicalLocale, en: TechnicalLocale, issues: Array<InterviewIssue>): void => {
    same(issues, path, "meta", JSON.stringify(vi.meta) === JSON.stringify(en.meta))
    same(issues, path, "diagram", (vi.diagram === null) === (en.diagram === null))
    same(issues, path, "followUps", vi.interviewer.followUps.length === en.interviewer.followUps.length)
    same(issues, path, "hints", vi.interviewer.hints.length === en.interviewer.hints.length)
    same(issues, path, "rubric", vi.grading.rubric.length === en.grading.rubric.length)
    same(issues, path, "keywords", vi.grading.keywords.length === en.grading.keywords.length)
    const shape = (locale: TechnicalLocale): string =>
        JSON.stringify(locale.grading.checklist.map((item) => [item.dimension, item.critical, item.scoreBand]))
    same(issues, path, "checklist", shape(vi) === shape(en))
    const levels = (locale: TechnicalLocale): string =>
        JSON.stringify(locale.grading.exampleResults.map((entry) => entry.level))
    same(issues, path, "exampleResults", levels(vi) === levels(en))
}

const technicalOf = (
    questionId: string,
    folder: string,
    texts: QuestionTexts,
    issues: Array<InterviewIssue>,
): QuestionOutcome => {
    const here = `questions/${folder}`
    const [vi, en] = localesOf(here, texts, issues, technicalLocaleOf)
    parityOf(here, vi, en, issues)
    const folders = bodyFoldersOf(texts)
    if (folders.length === 0)
        issues.push({ path: `${here}/bodies`, field: "", message: "a technical question needs at least one body" })
    const bodies = folders.map((name) => {
        const read = (locale: InterviewLocale): BodyLocale =>
            bodyLocaleOf(
                readerOf(`${here}/bodies/${name}/${locale}.md`, texts.get(`bodies/${name}/${locale}.md`) ?? "", issues),
                locale === "vi" ? vi.diagram : en.diagram,
            )
        return { name, vi: read("vi"), en: read("en") }
    })
    bodies.forEach((body) => same(issues, `${here}/bodies/${body.name}`, "lang", body.vi.lang === body.en.lang))
    let leaks = false
    const stemmed = (body: BodyLocale, material: GradingMaterial): QuestionPrompt => {
        const graded = [body.idealAnswer, ...material.checklist.map((item) => item.text), ...material.rubric]
        const stem = stemOf(body.prompt.prompt, groundOf([...graded, ...material.keywords]))
        leaks = leaks || givesAwayAnswer(stem, graded)
        return { ...body.prompt, prompt: stem }
    }
    const bodyMap = Object.fromEntries(
        bodies.map((body) => [
            body.vi.lang,
            {
                vi: stemmed(body.vi, vi.grading),
                en: stemmed(body.en, en.grading),
            },
        ]),
    )
    if (leaks) return { kind: "skipped" }
    const ideal = Object.fromEntries(
        bodies.map((body) => [body.vi.lang, { vi: body.vi.idealAnswer, en: body.en.idealAnswer }]),
    )
    return {
        kind: "draft",
        draft: {
            questionId,
            ...vi.meta,
            competency: null,
            leadershipTier: null,
            bodies: bodyMap,
            interviewer: { vi: vi.interviewer, en: en.interviewer },
            grading: { locales: { vi: vi.grading, en: en.grading }, ideal },
        },
    }
}

const starOf = (reader: FileReader): ReadonlyArray<StarRubricLine> => {
    const lines = textListOf(reader, "rubric").map((line, index): StarRubricLine => {
        const match = /^\[([A-Za-z]+)\](.+)$/su.exec(line)
        const key = STAR_KEYS.find((candidate) => candidate === match?.[1])
        if (key === undefined) addIssue(reader, `rubric[${index}]`, `expected a [${STAR_KEYS.join("|")}] prefix`)
        return { key: key ?? "situationClarity", text: (match?.[2] ?? line).trim() }
    })
    const keys = lines.map((line) => line.key).sort((a, b) => a.localeCompare(b))
    const expected: Array<StarKey> = [...STAR_KEYS].sort((a, b) => a.localeCompare(b))
    if (JSON.stringify(keys) !== JSON.stringify(expected))
        addIssue(reader, "rubric", "needs exactly the six STAR dimensions, once each")
    return lines
}

/** Everything a behavioural locale file holds. */
interface BehavioralLocale {
    readonly meta: Meta
    readonly competency: string
    readonly leadershipTier: string | null
    readonly prompt: string
    readonly star: ReadonlyArray<StarRubricLine>
    readonly ownershipSignal: string
}

const behavioralLocaleOf = (reader: FileReader): BehavioralLocale => ({
    meta: metaOf(reader),
    competency: textOf(reader, "competency"),
    leadershipTier: optionalTextOf(reader, "leadershipTier"),
    prompt: textOf(reader, "prompt"),
    star: starOf(reader),
    ownershipSignal: textOf(reader, "ownershipSignal"),
})

const behavioralMaterialOf = (locale: BehavioralLocale): GradingMaterial => ({
    rubric: [],
    checklist: [],
    keywords: [],
    star: locale.star,
    ownershipSignal: locale.ownershipSignal,
    exampleResults: [],
})

const behavioralPromptOf = (locale: BehavioralLocale): QuestionPrompt => ({
    prompt: locale.prompt,
    givenCode: null,
    diagram: null,
})

const behavioralOf = (
    questionId: string,
    folder: string,
    texts: QuestionTexts,
    issues: Array<InterviewIssue>,
): QuestionOutcome => {
    const here = `questions/${folder}`
    const [vi, en] = localesOf(here, texts, issues, behavioralLocaleOf)
    same(issues, here, "meta", JSON.stringify(vi.meta) === JSON.stringify(en.meta))
    same(issues, here, "competency", vi.competency === en.competency)
    const none: InterviewerMaterial = { followUps: [], hints: [] }
    return {
        kind: "draft",
        draft: {
            questionId,
            ...vi.meta,
            competency: vi.competency,
            leadershipTier: vi.leadershipTier,
            bodies: { agnostic: { vi: behavioralPromptOf(vi), en: behavioralPromptOf(en) } },
            interviewer: { vi: none, en: none },
            grading: { locales: { vi: behavioralMaterialOf(vi), en: behavioralMaterialOf(en) }, ideal: {} },
        },
    }
}

/**
 * Reads one question folder of a bank into a draft. The kinds the text interview cannot take (the capstone `design` and `coding`)
 * are skipped, not failed. Every issue goes into the shared list with its source path and field, so one run names everything wrong.
 */
export const questionDraftOf = (
    bankId: string,
    folder: string,
    family: InterviewFamily,
    texts: QuestionTexts,
    issues: Array<InterviewIssue>,
): QuestionOutcome => {
    const before = issues.length
    const probe = readerOf(`questions/${folder}/vi.md`, texts.get("vi.md") ?? "", [])
    const kind = optionalTextOf(probe, "kind")
    if (kind !== null && SKIPPED_KINDS.includes(kind)) return { kind: "skipped" }
    const number = /^(\d+)-/u.exec(folder)?.[1] ?? "0"
    const questionId = `${bankId}/${number}`
    const outcome =
        family === "technical"
            ? technicalOf(questionId, folder, texts, issues)
            : behavioralOf(questionId, folder, texts, issues)
    if (outcome.kind === "draft" && outcome.draft.family !== family) {
        issues.push({ path: `questions/${folder}/vi.md`, field: "family", message: `the bank is ${family}` })
    }
    return issues.length > before ? { kind: "invalid" } : outcome
}
