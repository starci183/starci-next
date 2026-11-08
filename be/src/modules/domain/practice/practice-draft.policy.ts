import { createHash } from "node:crypto"
import { blockNamed, blocksOf, hintStepsOf, valueOf, type PracticeBlock } from "./practice-format.policy"
import {
    PRACTICE_HINT_STEPS,
    PRACTICE_LANGUAGES,
    type PracticeDifficulty,
    type PracticeDraft,
    type PracticeExample,
    type PracticeHintText,
    type PracticeIssue,
    type PracticeLanguage,
    type PracticeLocaleText,
    type PracticeSolutions,
    type PracticeSourceEntry,
    type PracticeSourceFile,
    type PracticeStarterCodes,
    type PracticeTest,
} from "./practice.contracts"

const DIFFICULTIES: ReadonlySet<string> = new Set(["easy", "medium", "hard"])

/** The outcome of reading one problem folder: the draft, or why there is none. */
export interface PracticeDraftResult {
    /** The draft, or null when the folder has an issue. */
    readonly draft: PracticeDraft | null
    /** What is wrong with the folder. */
    readonly issues: ReadonlyArray<PracticeIssue>
}

/** What both locale files hold: the text and the two fields the files must agree on. */
interface TextDocument {
    readonly text: PracticeLocaleText
    readonly difficulty: PracticeDifficulty
    readonly domain: string
}

/** What only the English file holds: the numbers, the codes and the cases. */
interface StructureDocument {
    readonly orderIndex: number
    readonly tags: ReadonlyArray<string>
    readonly timeLimitMs: number
    readonly memoryLimitKb: number
    readonly starterCodes: PracticeStarterCodes
    readonly solutions: PracticeSolutions
    readonly examples: ReadonlyArray<PracticeExample>
    readonly tests: ReadonlyArray<PracticeTest>
}

const languageOf = (value: string): PracticeLanguage | undefined =>
    PRACTICE_LANGUAGES.find((language) => language === value)

const whole = (value: string | undefined): number | undefined => {
    const parsed = value === undefined || !/^\d+$/u.test(value) ? Number.NaN : Number(value)
    return Number.isSafeInteger(parsed) ? parsed : undefined
}

const valueOfField = (fields: ReadonlyArray<PracticeBlock>, name: string): string | undefined => {
    const block = blockNamed(fields, name)
    return block === undefined ? undefined : valueOf(block.lines)
}

/** Reads the code blocks (`## i`, `### lang`, `### content`) of the starter codes or the solutions. */
const codesOf = (
    block: PracticeBlock | undefined,
    path: string,
    field: string,
    issues: Array<PracticeIssue>,
): PracticeStarterCodes | null => {
    const codes = { cpp: "", java: "", javascript: "", python: "", typescript: "" }
    const seen = new Set<PracticeLanguage>()
    for (const entry of blocksOf((block?.lines ?? []).join("\n"), 2).blocks) {
        const parts = blocksOf(entry.lines.join("\n"), 3).blocks
        const language = languageOf(valueOfField(parts, "lang") ?? "")
        const content = valueOfField(parts, "content")
        if (language === undefined || content === undefined || content === "")
            issues.push({ path, field: `${field}[${entry.name}]`, message: "needs a known lang and a content" })
        else {
            codes[language] = content
            seen.add(language)
        }
    }
    const missing = PRACTICE_LANGUAGES.filter((language) => !seen.has(language))
    if (missing.length > 0) issues.push({ path, field, message: `lacks ${missing.join(", ")}` })
    return missing.length > 0 ? null : codes
}

/** Reads the cases (`## i`, `### input`, `### output`) of the example or the testcases. */
const casesOf = (
    block: PracticeBlock | undefined,
    path: string,
    field: string,
    issues: Array<PracticeIssue>,
): Array<PracticeExample> => {
    const cases: Array<PracticeExample> = []
    for (const entry of blocksOf((block?.lines ?? []).join("\n"), 2).blocks) {
        const parts = blocksOf(entry.lines.join("\n"), 3).blocks
        const input = valueOfField(parts, "input")
        const output = valueOfField(parts, "output")
        if (input === undefined || output === undefined)
            issues.push({ path, field: `${field}[${entry.name}]`, message: "needs an input and an output" })
        else cases.push({ input, output })
    }
    if (cases.length === 0) issues.push({ path, field, message: "needs at least one case" })
    return cases
}

const hintsOf = (hint: string | undefined, path: string, issues: Array<PracticeIssue>): Array<PracticeHintText> => {
    const steps = hintStepsOf(hint ?? "")
    if (
        steps.length !== PRACTICE_HINT_STEPS.length ||
        steps.some((step) => step.title === "" || step.markdown === "")
    ) {
        issues.push({ path, field: "hint", message: `needs ${PRACTICE_HINT_STEPS.length} titled steps` })
        return []
    }
    return steps.map((step, index) => ({ step: index + 1, title: step.title, markdown: step.markdown }))
}

const parseText = (file: PracticeSourceFile, issues: Array<PracticeIssue>): TextDocument | null => {
    const fields = blocksOf(file.text, 1).blocks
    const path = file.path
    const before = issues.length
    const title = valueOfField(fields, "title")
    const difficulty = valueOfField(fields, "difficulty")
    const domain = valueOfField(fields, "domain")
    const statement = valueOfField(fields, "statement")
    if (title === undefined || title === "") issues.push({ path, field: "title", message: "is required" })
    if (difficulty === undefined || !DIFFICULTIES.has(difficulty))
        issues.push({ path, field: "difficulty", message: "must be easy, medium or hard" })
    if (domain === undefined || domain === "") issues.push({ path, field: "domain", message: "is required" })
    if (statement === undefined || statement === "") issues.push({ path, field: "statement", message: "is required" })
    const hints = hintsOf(valueOfField(fields, "hint"), path, issues)
    if (
        issues.length > before ||
        title === undefined ||
        difficulty === undefined ||
        domain === undefined ||
        statement === undefined
    )
        return null
    return {
        text: { title, statement, hints },
        difficulty: difficulty === "easy" || difficulty === "hard" ? difficulty : "medium",
        domain,
    }
}

const parseStructure = (file: PracticeSourceFile, issues: Array<PracticeIssue>): StructureDocument | null => {
    const fields = blocksOf(file.text, 1).blocks
    const path = file.path
    const before = issues.length
    const orderIndex = whole(valueOfField(fields, "orderIndex"))
    const timeLimitMs = whole(valueOfField(fields, "timeLimitMs"))
    const memoryLimitKb = whole(valueOfField(fields, "memoryLimitKb"))
    if (orderIndex === undefined) issues.push({ path, field: "orderIndex", message: "must be a whole number" })
    if (timeLimitMs === undefined || timeLimitMs === 0)
        issues.push({ path, field: "timeLimitMs", message: "must be a positive whole number" })
    if (memoryLimitKb === undefined || memoryLimitKb === 0)
        issues.push({ path, field: "memoryLimitKb", message: "must be a positive whole number" })
    const tags = blocksOf((blockNamed(fields, "tags")?.lines ?? []).join("\n"), 2).blocks.map((tag) =>
        valueOf(tag.lines),
    )
    const starterCodes = codesOf(blockNamed(fields, "starterCodes"), path, "starterCodes", issues)
    const solutions = codesOf(blockNamed(fields, "solutions"), path, "solutions", issues)
    const examples = casesOf(blockNamed(fields, "example"), path, "example", issues)
    const tests = casesOf(blockNamed(fields, "testcases"), path, "testcases", issues)
    if (
        issues.length > before ||
        orderIndex === undefined ||
        timeLimitMs === undefined ||
        memoryLimitKb === undefined ||
        starterCodes === null ||
        solutions === null
    )
        return null
    return { orderIndex, tags, timeLimitMs, memoryLimitKb, starterCodes, solutions, examples, tests }
}

/** The SHA-256 over the sorted path and hash lines of the source files, the identity of the bytes of a version. */
export const practiceContentHashOf = (files: ReadonlyArray<PracticeSourceFile>): string =>
    createHash("sha256")
        .update(
            [...files]
                .sort((a, b) => a.path.localeCompare(b.path))
                .map((file) => `${file.path} ${file.sha256}`)
                .join("\n"),
        )
        .digest("hex")

const agree = (path: string, field: string, left: unknown, right: unknown, issues: Array<PracticeIssue>): void => {
    if (JSON.stringify(left) !== JSON.stringify(right))
        issues.push({ path, field, message: "differs from the English file" })
}

/**
 * Builds the draft of one problem folder from its `en.md` and `vi.md`: the English file holds the numbers, the codes and the
 * cases, both files hold the text (title, statement, hint ladder) and must agree on the difficulty and the pattern, and the
 * pattern must be the folder the problem sits under. A folder with any issue gives no draft.
 */
export const buildPracticeDraft = (
    entry: PracticeSourceEntry,
    files: ReadonlyArray<PracticeSourceFile>,
): PracticeDraftResult => {
    const issues: Array<PracticeIssue> = []
    const english = files.find((file) => file.path === "en.md")
    const vietnamese = files.find((file) => file.path === "vi.md")
    if (english === undefined) issues.push({ path: "en.md", field: "", message: "is missing" })
    if (vietnamese === undefined) issues.push({ path: "vi.md", field: "", message: "is missing" })
    if (english === undefined || vietnamese === undefined) return { draft: null, issues }
    const en = parseText(english, issues)
    const vi = parseText(vietnamese, issues)
    const structure = parseStructure(english, issues)
    if (en === null || vi === null || structure === null) return { draft: null, issues }
    if (en.domain !== entry.pattern)
        issues.push({ path: "en.md", field: "domain", message: `is ${en.domain}, the folder is ${entry.pattern}` })
    agree("vi.md", "domain", en.domain, vi.domain, issues)
    agree("vi.md", "difficulty", en.difficulty, vi.difficulty, issues)
    if (issues.length > 0) return { draft: null, issues }
    return {
        draft: {
            id: entry.slug,
            patternId: entry.pattern,
            orderIndex: structure.orderIndex,
            difficulty: en.difficulty,
            tags: structure.tags,
            timeLimitMs: structure.timeLimitMs,
            memoryLimitKb: structure.memoryLimitKb,
            content: { vi: vi.text, en: en.text },
            starterCodes: structure.starterCodes,
            examples: structure.examples,
            tests: structure.tests,
            solutions: structure.solutions,
            contentHash: practiceContentHashOf(files),
            sourceHashes: Object.fromEntries(files.map((file) => [file.path, file.sha256])),
        },
        issues,
    }
}
