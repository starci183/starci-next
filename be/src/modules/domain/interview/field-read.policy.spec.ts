import { Test } from "@nestjs/testing"
import { fieldOf, listOf, objectsOf } from "@tests/fixtures/builders/interview.builder"
import {
    addIssue,
    booleanOf,
    choiceOf,
    integerOf,
    itemsOf,
    objectListOf,
    optionalTextOf,
    readerOf,
    textListOf,
    textOf,
} from "./field-read.policy"
import type { InterviewIssue } from "./interview.contracts"

const POLICY: unique symbol = Symbol("spec.field-read-policy")
const policy = {
    addIssue,
    booleanOf,
    choiceOf,
    integerOf,
    itemsOf,
    objectListOf,
    optionalTextOf,
    readerOf,
    textListOf,
    textOf,
}

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

const PATH = "questions/0-q/vi.md"
const MIXED = [
    fieldOf("title", "  Hello  "),
    fieldOf("blank", "   "),
    fieldOf("count", "12"),
    fieldOf("bad-count", "twelve"),
    fieldOf("flag", "true"),
    fieldOf("off", "false"),
    fieldOf("bad-flag", "maybe"),
    fieldOf("tier", "middle"),
    fieldOf("bad-tier", "expert"),
    listOf("tags", ["  a ", "b"]),
    objectsOf("rows", [{ name: "x" }]),
    "# empty\n",
].join("")

describe("field read policy", () => {
    it("parses a file into a reader and reports the layout problems on the shared list", async () => {
        const { readerOf: read } = await build()
        const issues: Array<InterviewIssue> = []

        const clean = read(PATH, fieldOf("title", "T"), issues)
        const broken = read(PATH, "stray text\n", issues)

        expect(clean).toMatchObject({ path: PATH, issues })
        expect(clean.document.fields["title"]).toBe("T")
        expect(broken.document.problems).toHaveLength(1)
        expect(issues).toEqual([{ path: PATH, field: "", message: "line 1: text outside a field" }])
    })

    it("adds an issue on a field of the file", async () => {
        const { addIssue: add, readerOf: read } = await build()
        const issues: Array<InterviewIssue> = []

        add(read(PATH, "", issues), "title", "oops")

        expect(issues).toEqual([{ path: PATH, field: "title", message: "oops" }])
    })

    it("reads a required text trimmed, and an empty text with an issue when it is missing, blank or a list", async () => {
        const { readerOf: read, textOf: text } = await build()
        const issues: Array<InterviewIssue> = []
        const reader = read(PATH, MIXED, issues)

        expect(text(reader, "title")).toBe("Hello")
        expect(issues).toEqual([])
        expect(text(reader, "missing")).toBe("")
        expect(text(reader, "blank")).toBe("")
        expect(text(reader, "tags")).toBe("")
        expect(issues.map((issue) => issue.field)).toEqual(["missing", "blank", "tags"])
    })

    it("reads an optional text trimmed, or null when it is missing, blank or a list", async () => {
        const { optionalTextOf: optional, readerOf: read } = await build()
        const issues: Array<InterviewIssue> = []
        const reader = read(PATH, MIXED, issues)

        expect(optional(reader, "title")).toBe("Hello")
        expect(optional(reader, "missing")).toBeNull()
        expect(optional(reader, "blank")).toBeNull()
        expect(optional(reader, "tags")).toBeNull()
        expect(issues).toEqual([])
    })

    it("reads a whole number, and 0 with an issue only when there was a text that is not one", async () => {
        const { integerOf: integer, readerOf: read } = await build()
        const issues: Array<InterviewIssue> = []
        const reader = read(PATH, MIXED, issues)

        expect(integer(reader, "count")).toBe(12)
        expect(integer(reader, "bad-count")).toBe(0)
        expect(issues).toEqual([{ path: PATH, field: "bad-count", message: "expected a whole number" }])
        expect(integer(reader, "missing")).toBe(0)
        expect(issues.map((issue) => issue.message)).toEqual(["expected a whole number", "is missing or empty"])
    })

    it("reads a boolean, and false with an issue when it is neither true nor false", async () => {
        const { booleanOf: boolean, readerOf: read } = await build()
        const issues: Array<InterviewIssue> = []
        const reader = read(PATH, MIXED, issues)

        expect(boolean(reader, "flag")).toBe(true)
        expect(boolean(reader, "off")).toBe(false)
        expect(issues).toEqual([])
        expect(boolean(reader, "bad-flag")).toBe(false)
        expect(boolean(reader, "missing")).toBe(false)
        expect(issues.map((issue) => issue.message)).toEqual(["expected true or false", "is missing or empty"])
    })
})

describe("field read policy (continued)", () => {
    it("reads a choice, and the first allowed text with an issue when it is not allowed", async () => {
        const { choiceOf: choice, readerOf: read } = await build()
        const issues: Array<InterviewIssue> = []
        const reader = read(PATH, MIXED, issues)
        const allowed = ["junior", "middle", "senior"] as const

        expect(choice(reader, "tier", allowed)).toBe("middle")
        expect(issues).toEqual([])
        expect(choice(reader, "bad-tier", allowed)).toBe("junior")
        expect(choice(reader, "missing", allowed)).toBe("junior")
        expect(issues.map((issue) => issue.message)).toEqual([
            "expected one of junior, middle, senior",
            "is missing or empty",
        ])
    })

    it("lists the items of a list field, and none for a text or a missing field", async () => {
        const { itemsOf: items, readerOf: read } = await build()
        const reader = read(PATH, MIXED, [])

        expect(items(reader, "tags")).toEqual(["  a ", "b"])
        expect(items(reader, "title")).toEqual([])
        expect(items(reader, "missing")).toEqual([])
    })

    it("reads the plain items of a list trimmed, and flags an object item", async () => {
        const { readerOf: read, textListOf: texts } = await build()
        const issues: Array<InterviewIssue> = []
        const reader = read(PATH, MIXED, issues)

        expect(texts(reader, "tags")).toEqual(["a", "b"])
        expect(issues).toEqual([])
        expect(texts(reader, "rows")).toEqual([])
        expect(issues).toEqual([{ path: PATH, field: "rows[0]", message: "expected a text item" }])
    })

    it("reads the object items of a list, and flags a plain item", async () => {
        const { objectListOf: objects, readerOf: read } = await build()
        const issues: Array<InterviewIssue> = []
        const reader = read(PATH, MIXED, issues)

        expect(objects(reader, "rows")).toEqual([{ name: "x" }])
        expect(issues).toEqual([])
        expect(objects(reader, "tags")).toEqual([])
        expect(issues.map((issue) => issue.field)).toEqual(["tags[0]", "tags[1]"])
        expect(issues[0]?.message).toBe("expected an item with sub-fields")
    })
})
