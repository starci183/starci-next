import { createHash } from "node:crypto"
import { builder } from "@starci/jest-preset"
import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"
import type {
    PracticeContent,
    PracticeDifficulty,
    PracticeLanguage,
    PracticeSourceFile,
} from "@modules/domain/practice"

/** The marker line of the separator field format. */
const MARK = "<!-- @starci/seperator -->"

/** A learner nobody else uses. */
export const PRACTICE_LEARNER = "30000000-0000-4000-8000-000000000001"

/** A text that appears only in the hidden parts of the demo problem, so a spec can prove a read never leaks it. */
export const PRACTICE_HIDDEN_MARK = "HIDDEN-ONLY-TEXT"

/** The languages of the starter codes and solutions. */
export const LANGUAGES: ReadonlyArray<PracticeLanguage> = ["python", "javascript", "typescript", "java", "cpp"]

/** The fields of one demo problem file. */
export interface ProblemFileOptions {
    readonly pattern: string
    readonly difficulty: string
    readonly orderIndex: string
    readonly timeLimitMs: string
    readonly omit: ReadonlyArray<string>
    readonly hintTitles: ReadonlyArray<string>
    readonly languages: ReadonlyArray<string>
    readonly examples: ReadonlyArray<{ input: string; output: string }>
    readonly tests: ReadonlyArray<{ input: string; output: string }>
}

const fileOptions = builder<ProblemFileOptions>({
    pattern: "arrays",
    difficulty: "medium",
    orderIndex: "0",
    timeLimitMs: "2000",
    omit: [],
    hintTitles: ["Analysis", "Approach", "Related"],
    languages: LANGUAGES,
    examples: [{ input: "1 2", output: "3" }],
    tests: [
        { input: `1 1 ${PRACTICE_HIDDEN_MARK}`, output: "2" },
        { input: "2 2", output: "4" },
    ],
})

const code = (language: string, kind: string): string =>
    `# ${kind}-${language}\nprint(sum(map(int, input().split()[:2])))`

const codeBlocks = (name: string, languages: ReadonlyArray<string>, kind: string): string =>
    `# ${name}\n${languages
        .map(
            (language, index) =>
                `## ${index}\n### lang\n${language}\n### content\n${MARK}\n${code(language, kind)}\n${MARK}\n`,
        )
        .join("")}`

const caseBlocks = (name: string, cases: ReadonlyArray<{ input: string; output: string }>): string =>
    `# ${name}\n${cases
        .map(
            (test, index) =>
                `## ${index}\n### input\n${MARK}\n${test.input}\n${MARK}\n### output\n${MARK}\n${test.output}\n${MARK}\n`,
        )
        .join("")}`

/** The text of one problem file in the teacher's format; only the English file carries the numbers, codes and cases. */
export const problemFileText = (locale: "en" | "vi", overrides: Partial<ProblemFileOptions> = {}): string => {
    const options = fileOptions(overrides)
    const hint = options.hintTitles
        .map((title, index) => `:::muted\n${title}\n:::\n${locale} hint ${index + 1} prose`)
        .join("\n\n")
    const sections: Array<[string, string]> = [
        ["title", `${locale} Sum Two\n`],
        ["difficulty", `${options.difficulty}\n`],
        ["domain", `${options.pattern}\n`],
        ["orderIndex", `${options.orderIndex}\n`],
        ["tags", "## 0\narrays\n## 1\nmath\n"],
        ["timeLimitMs", `${options.timeLimitMs}\n`],
        ["memoryLimitKb", "262144\n"],
        ["statement", `${MARK}\n# ${locale} statement\n\nAdd two numbers.\n${MARK}\n`],
        ["starterCodes", codeBlocks("starterCodes", options.languages, "starter").replace(/^# starterCodes\n/u, "")],
        [
            "solutions",
            codeBlocks("solutions", options.languages, `${PRACTICE_HIDDEN_MARK}-solution`).replace(
                /^# solutions\n/u,
                "",
            ),
        ],
        ["example", caseBlocks("example", options.examples).replace(/^# example\n/u, "")],
        ["testcases", caseBlocks("testcases", options.tests).replace(/^# testcases\n/u, "")],
        ["hint", `${MARK}\n${hint}\n${MARK}\n`],
    ]
    const keep = (name: string): boolean => !options.omit.includes(name)
    const englishOnly = new Set([
        "orderIndex",
        "tags",
        "timeLimitMs",
        "memoryLimitKb",
        "starterCodes",
        "solutions",
        "example",
        "testcases",
    ])
    return sections
        .filter(([name]) => keep(name) && (locale === "en" || !englishOnly.has(name)))
        .map(([name, body]) => `# ${name}\n${body}`)
        .join("")
}

/** A source file with the hash of its text. */
export const practiceSourceFileOf = (path: string, text: string): PracticeSourceFile => ({
    path,
    text,
    sha256: createHash("sha256").update(text).digest("hex"),
})

/** The two files of a valid demo problem folder. */
export const practiceFilesOf = (overrides: Partial<ProblemFileOptions> = {}): ReadonlyArray<PracticeSourceFile> => [
    practiceSourceFileOf("en.md", problemFileText("en", overrides)),
    practiceSourceFileOf("vi.md", problemFileText("vi", overrides)),
]

/** The public content of a demo problem version as the importer stores it. */
export const practiceContentOf = (slug: string): PracticeContent => ({
    vi: {
        title: `vi ${slug}`,
        statement: `vi statement ${slug}`,
        hints: [1, 2, 3].map((step) => ({ step, title: `vi title ${step}`, markdown: `vi hint ${step}` })),
    },
    en: {
        title: `en ${slug}`,
        statement: `en statement ${slug}`,
        hints: [1, 2, 3].map((step) => ({ step, title: `en title ${step}`, markdown: `en hint ${step}` })),
    },
})

/** One problem version to store for a world spec. */
export interface StoredProblem {
    readonly slug: string
    readonly pattern: string
    readonly order: number
    readonly difficulty?: PracticeDifficulty
}

const INSERT_PROBLEM = sql`INSERT INTO practice_problem_versions (
    problem_id, version, content_hash, status, pattern_id, order_index, difficulty, tags, time_limit_ms, memory_limit_kb,
    titles, content, starter_codes, examples, tests, solutions, source_hashes, imported_at
) VALUES (
    $1::text, 'spec-1', $2::text, 'published', $3::text, $4::int, $5::text, '["spec"]'::jsonb, 2000, 262144,
    $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, '{}'::jsonb, now()
)`

/** Stores the demo problems for a world spec: the example is "1 2" -> "3", the hidden tests and solutions hold the secret. */
export const persistPracticeProblems = async (
    manager: EntityManager | undefined,
    problems: ReadonlyArray<StoredProblem>,
): Promise<void> => {
    if (manager === undefined) return
    await Promise.all(
        problems.map((problem) => {
            const content = practiceContentOf(problem.slug)
            return manager.query(INSERT_PROBLEM, [
                problem.slug,
                `hash-${problem.slug}`,
                problem.pattern,
                problem.order,
                problem.difficulty ?? "easy",
                JSON.stringify({ vi: content.vi.title, en: content.en.title }),
                JSON.stringify(content),
                JSON.stringify(Object.fromEntries(LANGUAGES.map((language) => [language, `# starter ${language}`]))),
                JSON.stringify([{ input: "1 2", output: "3" }]),
                JSON.stringify([
                    { input: `1 1 ${PRACTICE_HIDDEN_MARK}`, output: "2" },
                    { input: "2 2", output: "4" },
                ]),
                JSON.stringify(
                    Object.fromEntries(LANGUAGES.map((language) => [language, `# ${PRACTICE_HIDDEN_MARK} solution`])),
                ),
            ])
        }),
    )
}
