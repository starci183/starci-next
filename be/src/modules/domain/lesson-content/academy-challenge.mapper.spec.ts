import { Test } from "@nestjs/testing"
import { LessonContentErrorCode } from "./errors/lesson-content.error"
import { parseChallengeDefinition, parseChallengeSubmission } from "./academy-challenge.mapper"

const SEPARATOR = "<!-- @starci/seperator -->"
const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const leaf = (level: number, name: string, value: string): string =>
    `${"#".repeat(level)} ${name}\n${SEPARATOR}\n${value}\n${SEPARATOR}\n`

const langs = (level: number, item: (language: string) => string): string =>
    `${"#".repeat(level)} langs\n${["typescript", "java", "csharp", "go"].map((language, index) => `${"#".repeat(level + 1)} ${index}\n${leaf(level + 2, "lang", language)}${item(language)}`).join("")}`

const section = (name: string, count: number, item: (language: string) => string): string =>
    `# ${name}\n${Array.from({ length: count }, (_, index) => `## ${index}\n${langs(3, item)}`).join("")}`

const definitionDoc = (
    overrides: { readonly extra?: string; readonly difficulty?: string; readonly requirements?: string } = {},
): Uint8Array =>
    encode(
        `${leaf(1, "sortIndex", "0")}${leaf(1, "title", "Title")}${leaf(1, "description", "Desc")}` +
            `${overrides.requirements ?? section("requirements", 2, (language) => `${leaf(5, "title", `req ${language}`)}${leaf(5, "body", "body")}${leaf(5, "score", "5")}`)}` +
            `${section("steps", 1, (language) => `${leaf(5, "title", `step ${language}`)}${leaf(5, "body", "do it")}`)}` +
            `${section("outputs", 1, () => leaf(5, "text", "expected"))}` +
            `${section("prerequisites", 1, () => leaf(5, "text", "know rest"))}` +
            `${leaf(1, "difficulty", overrides.difficulty ?? "easy")}${leaf(1, "score", "40")}${leaf(1, "verified", "2026-06-02")}${overrides.extra ?? ""}`,
    )

const criterion = (index: number): string =>
    `## ${index}\n### body\n${["typescript", "java", "csharp", "go"].map((language, at) => `#### ${at}\n${leaf(5, "lang", language)}${leaf(5, "body", `crit ${language}`)}`).join("")}${leaf(3, "score", "10")}${leaf(3, "critical", "true")}`

const submission = (extra: string = ""): Uint8Array =>
    encode(
        `${leaf(1, "type", "code")}${leaf(1, "title", "Submit")}${leaf(1, "description", "How")}${leaf(1, "score", "60")}` +
            `# outcomeCriterias\n${criterion(0)}# approachCriterias\n${criterion(0)}${criterion(1)}${extra}`,
    )

const malformed = LessonContentErrorCode.SourceMalformed
const unclassified = LessonContentErrorCode.ClassificationUnknown

const SUBJECT = Symbol("academy-challenge")
const helpers = { parseChallengeDefinition, parseChallengeSubmission }

/** Builds the subject through the testing module, the way consumers reach it. */
const build = async (): Promise<typeof helpers> =>
    (await Test.createTestingModule({ providers: [{ provide: SUBJECT, useFactory: () => helpers }] }).compile()).get<
        typeof helpers
    >(SUBJECT)

describe("parseChallengeDefinition", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("reads the public prompt per language and the protected grading", () => {
        const { order, definition, grading } = subject.parseChallengeDefinition(definitionDoc())

        expect(order).toBe(0)
        expect(definition.title).toBe("Title")
        expect(definition.difficulty).toBe("easy")
        expect(definition.requirements.typescript).toHaveLength(2)
        expect(definition.requirements.go[0]?.title).toBe("req go")
        expect(definition.prerequisites.java).toEqual(["know rest"])
        expect(grading.scoreWeight).toBe(40)
        expect(grading.verifiedAt).toBe("2026-06-02")
        expect(grading.requirementScores.typescript).toEqual([5, 5])
        expect(grading.solutionSteps).toHaveLength(1)
        expect(grading.expectedOutputs[0]?.go).toBe("expected")
    })

    it("refuses unknown top-level fields", () => {
        expect(() => subject.parseChallengeDefinition(definitionDoc({ extra: leaf(1, "rubric", "x") }))).toThrow(
            unclassified,
        )
    })

    it("refuses an unknown difficulty", () => {
        expect(() => subject.parseChallengeDefinition(definitionDoc({ difficulty: "impossible" }))).toThrow(malformed)
    })

    it("refuses a language item that is not a known language", () => {
        const rest = `${section("steps", 1, () => leaf(5, "title", "s"))}${section("outputs", 1, () => leaf(5, "text", "o"))}${section("prerequisites", 1, () => leaf(5, "text", "p"))}${leaf(1, "difficulty", "easy")}${leaf(1, "score", "1")}`
        const rawWrong = encode(
            `${leaf(1, "sortIndex", "0")}${leaf(1, "title", "T")}${leaf(1, "description", "D")}` +
                `# requirements\n## 0\n${langs(3, () => leaf(5, "title", "t")).replace(`${leaf(5, "lang", "typescript")}`, `${leaf(5, "lang", "rust")}`)}` +
                rest,
        )

        expect(() => subject.parseChallengeDefinition(rawWrong)).toThrow(malformed)
    })
})

describe("parseChallengeDefinition validates the language items", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })

    it("refuses a duplicated or missing language inside an item list", () => {
        const rest = `${section("steps", 1, () => `${leaf(5, "title", "s")}${leaf(5, "body", "b")}`)}${section("outputs", 1, () => leaf(5, "text", "o"))}${section("prerequisites", 1, () => leaf(5, "text", "p"))}${leaf(1, "difficulty", "easy")}${leaf(1, "score", "1")}`
        const item = (lang: string, title: string): string =>
            `${leaf(5, "lang", lang)}${leaf(5, "title", title)}${leaf(5, "body", "b")}${leaf(5, "score", "1")}`
        const dup = encode(
            `${leaf(1, "sortIndex", "0")}${leaf(1, "title", "T")}${leaf(1, "description", "D")}` +
                `# requirements\n## 0\n### langs\n#### 0\n${item("typescript", "a")}#### 1\n${item("typescript", "b")}` +
                rest,
        )
        const missing = encode(
            `${leaf(1, "sortIndex", "0")}${leaf(1, "title", "T")}${leaf(1, "description", "D")}` +
                `# requirements\n## 0\n### langs\n#### 0\n${item("typescript", "a")}#### 1\n${item("java", "b")}#### 2\n${item("csharp", "c")}` +
                rest,
        )

        expect(() => subject.parseChallengeDefinition(dup)).toThrow(malformed)
        expect(() => subject.parseChallengeDefinition(missing)).toThrow(malformed)
    })

    it("refuses unknown fields inside a language item or a group", () => {
        const badItem = encode(
            `${leaf(1, "sortIndex", "0")}${leaf(1, "title", "T")}${leaf(1, "description", "D")}` +
                `# requirements\n## 0\n### langs\n#### 0\n${leaf(5, "lang", "typescript")}${leaf(5, "title", "a")}${leaf(5, "answer", "x")}#### 1\n${leaf(5, "lang", "java")}${leaf(5, "title", "b")}#### 2\n${leaf(5, "lang", "csharp")}${leaf(5, "title", "c")}#### 3\n${leaf(5, "lang", "go")}${leaf(5, "title", "d")}` +
                `${section("steps", 1, () => leaf(5, "title", "s"))}${section("outputs", 1, () => leaf(5, "text", "o"))}${section("prerequisites", 1, () => leaf(5, "text", "p"))}` +
                `${leaf(1, "difficulty", "easy")}${leaf(1, "score", "1")}`,
        )

        expect(() => subject.parseChallengeDefinition(badItem)).toThrow(unclassified)

        const badGroup = encode(
            `${leaf(1, "sortIndex", "0")}${leaf(1, "title", "T")}${leaf(1, "description", "D")}` +
                `# requirements\n## 0\n${langs(3, () => leaf(5, "title", "t"))}### stray\n${SEPARATOR}\nx\n${SEPARATOR}\n` +
                `${section("steps", 1, () => leaf(5, "title", "s"))}${section("outputs", 1, () => leaf(5, "text", "o"))}${section("prerequisites", 1, () => leaf(5, "text", "p"))}` +
                `${leaf(1, "difficulty", "easy")}${leaf(1, "score", "1")}`,
        )

        expect(() => subject.parseChallengeDefinition(badGroup)).toThrow(unclassified)
    })
})

describe("parseChallengeSubmission", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("reads the artifact type, score and both rubric sections", () => {
        const grading = subject.parseChallengeSubmission(submission())

        expect(grading.submissionType).toBe("code")
        expect(grading.submissionScore).toBe(60)
        expect(grading.outcomeCriterias).toHaveLength(1)
        expect(grading.approachCriterias).toHaveLength(2)
        expect(grading.outcomeCriterias[0]?.critical).toBe(true)
        expect(grading.outcomeCriterias[0]?.bodies.go).toBe("crit go")
    })

    it("refuses unknown fields and malformed criteria", () => {
        expect(() => subject.parseChallengeSubmission(submission(leaf(1, "hint", "x")))).toThrow(unclassified)

        const badCriterion = encode(
            `${leaf(1, "type", "code")}${leaf(1, "title", "T")}${leaf(1, "description", "D")}${leaf(1, "score", "1")}` +
                `# outcomeCriterias\n## 0\n### body\n#### 0\n${leaf(5, "lang", "typescript")}${leaf(5, "body", "b")}${leaf(3, "score", "1")}${leaf(3, "critical", "true")}${leaf(3, "extra", "x")}` +
                `# approachCriterias\n`,
        )

        expect(() => subject.parseChallengeSubmission(badCriterion)).toThrow(unclassified)
    })
})
