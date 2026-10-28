import { Test } from "@nestjs/testing"
import { LessonContentErrorCode } from "./errors/lesson-content.error"
import {
    bytesOf,
    childNamed,
    containerNamed,
    leafBool,
    leafInt,
    leafText,
    leafTextOrNull,
    numberedChildren,
    parseAcademyDocument,
    requiredChild,
    sha256Hex,
    splitLines,
    textOf,
    unknownNames,
} from "./academy-document.mapper"

const SEPARATOR = "<!-- @starci/seperator -->"
const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const leaf = (name: string, value: string): string => `# ${name}\n${SEPARATOR}\n${value}\n${SEPARATOR}\n`

const SUBJECT = Symbol("academy-document")
const helpers = {
    bytesOf,
    childNamed,
    containerNamed,
    leafBool,
    leafInt,
    leafText,
    leafTextOrNull,
    numberedChildren,
    parseAcademyDocument,
    requiredChild,
    sha256Hex,
    splitLines,
    textOf,
    unknownNames,
}

/** Builds the subject through the testing module, the way consumers reach it. */
const build = async (): Promise<typeof helpers> =>
    (await Test.createTestingModule({ providers: [{ provide: SUBJECT, useFactory: () => helpers }] }).compile()).get<
        typeof helpers
    >(SUBJECT)

describe("splitLines", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("splits LF and CRLF lines with exact byte ranges and no ending in the text", () => {
        const raw = encode("one\r\ntwo\nthree")

        expect(subject.splitLines(raw)).toEqual([
            { start: 0, end: 5, text: "one" },
            { start: 5, end: 9, text: "two" },
            { start: 9, end: 14, text: "three" },
        ])
    })
})

describe("textOf and bytesOf", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("answer the text and the raw bytes of a range", () => {
        const raw = encode("h\u00e9llo")

        expect(subject.textOf(raw, { start: 0, end: raw.byteLength })).toBe("h\u00e9llo")
        expect([...subject.bytesOf(raw, { start: 0, end: 2 })]).toEqual([0x68, 0xc3])
    })
})

describe("sha256Hex", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("answers the lowercase hex digest of the slice", () => {
        expect(subject.sha256Hex(encode("abc"))).toBe(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        )
    })
})

describe("parseAcademyDocument", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("reads leaf values between separators and nests deeper headings", () => {
        const raw = encode(`${leaf("title", "hello")}# part\n## one\n${SEPARATOR}\nbody\n${SEPARATOR}\n`)

        const roots = subject.parseAcademyDocument(raw)

        expect(roots.map((node) => node.name)).toEqual(["title", "part"])
        const part = roots[1]
        const one = part?.children[0]
        expect(part?.value).toBeNull()
        expect(one?.name).toBe("one")
        expect(subject.textOf(raw, one?.value ?? { start: 0, end: 0 })).toBe("body\n")
    })

    it("skips blank lines between sections", () => {
        const roots = subject.parseAcademyDocument(encode(`\n\n${leaf("a", "1")}\n\n${leaf("b", "2")}`))

        expect(roots.map((node) => node.name)).toEqual(["a", "b"])
    })

    it("refuses a line that is not a heading", () => {
        expect(() => subject.parseAcademyDocument(encode("prose\n"))).toThrow(LessonContentErrorCode.SourceMalformed)
    })

    it("refuses a value no separator closes", () => {
        expect(() => subject.parseAcademyDocument(encode(`# a\n${SEPARATOR}\nvalue\n`))).toThrow(
            LessonContentErrorCode.SourceMalformed,
        )
    })
})

describe("child lookup", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    const roots = () =>
        subject.parseAcademyDocument(encode(`${leaf("title", "t")}# box\n## a\n${SEPARATOR}\nv\n${SEPARATOR}\n`))

    it("finds a child by name or answers null", () => {
        const nodes = roots()

        expect(subject.childNamed(nodes, "title")?.name).toBe("title")
        expect(subject.childNamed(nodes, "absent")).toBeNull()
    })

    it("requiredChild refuses a missing name", () => {
        expect(() => subject.requiredChild(roots(), "absent")).toThrow(LessonContentErrorCode.SourceMalformed)
    })

    it("containerNamed refuses a leaf child", () => {
        expect(() => subject.containerNamed(roots(), "title")).toThrow(LessonContentErrorCode.SourceMalformed)
        expect(subject.containerNamed(roots(), "box").children).toHaveLength(1)
    })
})

describe("numberedChildren", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("sorts decimal ordinals numerically", () => {
        const raw = encode(`# items\n## 10\n${SEPARATOR}\nx\n${SEPARATOR}\n## 2\n${SEPARATOR}\ny\n${SEPARATOR}\n`)

        const children = subject.numberedChildren(subject.containerNamed(subject.parseAcademyDocument(raw), "items"))

        expect(children.map((child) => child.name)).toEqual(["2", "10"])
    })

    it("refuses a non-numeric child name", () => {
        const raw = encode(`# items\n## first\n${SEPARATOR}\nx\n${SEPARATOR}\n`)

        expect(() =>
            subject.numberedChildren(subject.containerNamed(subject.parseAcademyDocument(raw), "items")),
        ).toThrow(LessonContentErrorCode.SourceMalformed)
    })
})

describe("leaf readers", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    const roots = () =>
        subject.parseAcademyDocument(
            encode(`${leaf("count", "12")}${leaf("flag", "true")}${leaf("text", " hello ")}# box\n## a\n`),
        )

    it("leafText refuses a missing leaf and a container child", () => {
        const nodes = roots()

        expect(() => subject.leafText(encode(""), nodes, "absent")).toThrow(LessonContentErrorCode.SourceMalformed)
        expect(() => subject.leafText(encode(""), nodes, "box")).toThrow(LessonContentErrorCode.SourceMalformed)
    })

    it("reads the leaf values", () => {
        const raw = encode(`${leaf("count", "12")}${leaf("flag", "true")}${leaf("text", " hello ")}`)
        const nodes = subject.parseAcademyDocument(raw)

        expect(subject.leafText(raw, nodes, "text")).toBe("hello")
        expect(subject.leafInt(raw, nodes, "count")).toBe(12)
        expect(subject.leafBool(raw, nodes, "flag")).toBe(true)
        expect(subject.leafTextOrNull(raw, nodes, "absent")).toBeNull()
    })

    it("refuses missing, non-integer, non-boolean and container leaves", () => {
        const raw = encode(`${leaf("count", "x")}${leaf("flag", "yes")}# box\n## a\n`)
        const nodes = subject.parseAcademyDocument(raw)

        expect(() => subject.leafText(raw, nodes, "absent")).toThrow(LessonContentErrorCode.SourceMalformed)
        expect(() => subject.leafInt(raw, nodes, "count")).toThrow(LessonContentErrorCode.SourceMalformed)
        expect(() => subject.leafBool(raw, nodes, "flag")).toThrow(LessonContentErrorCode.SourceMalformed)
        expect(() => subject.leafTextOrNull(raw, nodes, "box")).toThrow(LessonContentErrorCode.SourceMalformed)
    })
})

describe("unknownNames", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("lists the names outside the allowed set", () => {
        const nodes = subject.parseAcademyDocument(encode(`${leaf("a", "1")}${leaf("b", "2")}${leaf("c", "3")}`))

        expect(subject.unknownNames(nodes, ["a", "c"])).toEqual(["b"])
    })
})
