import { Test } from "@nestjs/testing"
import {
    PRACTICE_HIDDEN_MARK,
    practiceFilesOf,
    practiceSourceFileOf,
    problemFileText,
} from "@tests/fixtures/builders/practice.builder"
import * as subject from "./practice-draft.policy"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import type { PracticeSourceFile } from "./practice.contracts"

const SUBJECT: unique symbol = Symbol("practice.practice-draft.policy")

const ENTRY = { pattern: "arrays", slug: "sum-two" }

const issuesOf = (files: ReturnType<typeof practiceFilesOf>, entry = ENTRY) =>
    subject.buildPracticeDraft(entry, files).issues

const fileOf = (path: string): PracticeSourceFile => {
    const file = practiceFilesOf().find((candidate) => candidate.path === path)
    if (file === undefined)
        throw new PracticeError({ code: PracticeErrorCode.ContentInvalid, params: { folders: path } })
    return file
}

describe("buildPracticeDraft", () => {
    let buildPracticeDraft: typeof subject.buildPracticeDraft
    let practiceContentHashOf: typeof subject.practiceContentHashOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ buildPracticeDraft, practiceContentHashOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("builds the draft of a valid folder: numbers, codes and cases from en.md, text from both files", () => {
        const { draft, issues } = buildPracticeDraft(ENTRY, practiceFilesOf())

        expect(issues).toEqual([])
        expect(draft).toMatchObject({
            id: "sum-two",
            patternId: "arrays",
            orderIndex: 0,
            difficulty: "medium",
            tags: ["arrays", "math"],
            timeLimitMs: 2000,
            memoryLimitKb: 262144,
            examples: [{ input: "1 2", output: "3" }],
        })
        expect(draft?.tests).toHaveLength(2)
        expect(Object.keys(draft?.starterCodes ?? {}).sort()).toEqual([
            "cpp",
            "java",
            "javascript",
            "python",
            "typescript",
        ])
        expect(draft?.solutions.python).toContain(PRACTICE_HIDDEN_MARK)
        expect(draft?.content.en.title).toBe("en Sum Two")
        expect(draft?.content.vi.title).toBe("vi Sum Two")
        expect(draft?.content.vi.hints.map((hint) => hint.step)).toEqual([1, 2, 3])
        expect(draft?.content.en.hints.map((hint) => hint.title)).toEqual(["Analysis", "Approach", "Related"])
    })

    it("hashes the folder from the sorted path and hash lines, whatever the order of the files", () => {
        const files = practiceFilesOf()
        const draft = buildPracticeDraft(ENTRY, files).draft

        expect(draft?.contentHash).toBe(practiceContentHashOf(files))
        expect(practiceContentHashOf([...files].reverse())).toBe(practiceContentHashOf(files))
        expect(draft?.sourceHashes).toEqual({ "en.md": files[0]?.sha256, "vi.md": files[1]?.sha256 })
    })

    it("changes the hash when one byte of a file changes", () => {
        const other = practiceFilesOf({ timeLimitMs: "3000" })

        expect(practiceContentHashOf(other)).not.toBe(practiceContentHashOf(practiceFilesOf()))
    })

    it("gives no draft and names the missing files", () => {
        const en = fileOf("en.md")
        const vi = fileOf("vi.md")

        expect(buildPracticeDraft(ENTRY, [vi])).toEqual({
            draft: null,
            issues: [{ path: "en.md", field: "", message: "is missing" }],
        })
        expect(issuesOf([en])).toEqual([{ path: "vi.md", field: "", message: "is missing" }])
    })
})

describe("buildPracticeDraft refuses a folder", () => {
    it("refuses a folder without a title, a statement or a known difficulty", () => {
        expect(issuesOf(practiceFilesOf({ omit: ["title"] })).map((issue) => issue.field)).toContain("title")
        expect(issuesOf(practiceFilesOf({ omit: ["statement"] })).map((issue) => issue.field)).toContain("statement")
        expect(issuesOf(practiceFilesOf({ difficulty: "brutal" })).map((issue) => issue.field)).toContain("difficulty")
    })

    it("refuses a hint ladder that does not have three titled steps", () => {
        const issues = issuesOf(practiceFilesOf({ hintTitles: ["One", "Two"] }))

        expect(issues).toContainEqual({ path: "en.md", field: "hint", message: "needs 3 titled steps" })
    })

    it("refuses starter codes and solutions that lack a language", () => {
        const issues = issuesOf(practiceFilesOf({ languages: ["python", "java"] }))

        expect(issues).toContainEqual({
            path: "en.md",
            field: "starterCodes",
            message: "lacks cpp, javascript, typescript",
        })
        expect(issues.map((issue) => issue.field)).toContain("solutions")
    })

    it("refuses an example or a test list with no case", () => {
        const issues = issuesOf(practiceFilesOf({ examples: [], tests: [] }))

        expect(issues).toContainEqual({ path: "en.md", field: "example", message: "needs at least one case" })
        expect(issues).toContainEqual({ path: "en.md", field: "testcases", message: "needs at least one case" })
    })

    it("refuses numbers that are not whole and limits that are zero", () => {
        const fields = issuesOf(practiceFilesOf({ orderIndex: "x", timeLimitMs: "0" })).map((issue) => issue.field)

        expect(fields).toEqual(expect.arrayContaining(["orderIndex", "timeLimitMs"]))
    })

    it("refuses a problem whose domain is not the folder it sits under", () => {
        const issues = issuesOf(practiceFilesOf(), { pattern: "strings", slug: "sum-two" })

        expect(issues).toContainEqual({ path: "en.md", field: "domain", message: "is arrays, the folder is strings" })
    })

    it("refuses a vi.md that disagrees with en.md on the difficulty", () => {
        const en = fileOf("en.md")
        const vi = practiceSourceFileOf("vi.md", problemFileText("vi", { difficulty: "hard" }))

        expect(issuesOf([en, vi])).toContainEqual({
            path: "vi.md",
            field: "difficulty",
            message: "differs from the English file",
        })
    })
})

describe("buildPracticeDraft refuses a code block or a case", () => {
    it("refuses a code block with an unknown language", () => {
        const text = problemFileText("en").replace("### lang\npython", "### lang\nruby")
        const vi = fileOf("vi.md")

        const issues = issuesOf([practiceSourceFileOf("en.md", text), vi])

        expect(issues).toContainEqual({
            path: "en.md",
            field: "starterCodes[0]",
            message: "needs a known lang and a content",
        })
        expect(issues).toContainEqual({ path: "en.md", field: "starterCodes", message: "lacks python" })
    })

    it("refuses a code block with no lang field", () => {
        const text = problemFileText("en").replace("### lang", "### tongue")
        const vi = fileOf("vi.md")

        expect(issuesOf([practiceSourceFileOf("en.md", text), vi]).map((issue) => issue.field)).toContain(
            "starterCodes[0]",
        )
    })
})

describe("buildPracticeDraft refuses empty parts", () => {
    let buildPracticeDraft: typeof subject.buildPracticeDraft

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ buildPracticeDraft } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("refuses a code block with no content", () => {
        const text = problemFileText("en").replace("### content", "### body")
        const vi = fileOf("vi.md")

        expect(issuesOf([practiceSourceFileOf("en.md", text), vi])).toContainEqual({
            path: "en.md",
            field: "starterCodes[0]",
            message: "needs a known lang and a content",
        })
    })

    it("refuses a code block whose content is empty", () => {
        const text = problemFileText("en").replace(
            /(### content\n<!-- @starci\/seperator -->\n)[^]*?(<!-- @starci\/seperator -->)/u,
            "$1$2",
        )
        const vi = fileOf("vi.md")

        expect(issuesOf([practiceSourceFileOf("en.md", text), vi]).map((issue) => issue.field)).toContain(
            "starterCodes[0]",
        )
    })

    it("refuses a case without an output", () => {
        const text = problemFileText("en").replace("### output", "### result")
        const vi = fileOf("vi.md")

        const issues = issuesOf([practiceSourceFileOf("en.md", text), vi])

        expect(issues).toContainEqual({ path: "en.md", field: "example[0]", message: "needs an input and an output" })
        expect(issues).toContainEqual({ path: "en.md", field: "example", message: "needs at least one case" })
    })

    it("refuses an en.md with no fields at all", () => {
        const vi = fileOf("vi.md")

        const { draft, issues } = buildPracticeDraft(ENTRY, [practiceSourceFileOf("en.md", "nothing here"), vi])

        expect(draft).toBeNull()
        expect(issues.map((issue) => issue.field)).toEqual(
            expect.arrayContaining(["title", "difficulty", "domain", "statement", "hint", "orderIndex"]),
        )
    })

    it("treats easy and hard as themselves and any other valid text as medium", () => {
        expect(buildPracticeDraft(ENTRY, practiceFilesOf({ difficulty: "easy" })).draft?.difficulty).toBe("easy")
        expect(buildPracticeDraft(ENTRY, practiceFilesOf({ difficulty: "hard" })).draft?.difficulty).toBe("hard")
    })
})
