import { Test } from "@nestjs/testing"
import { DECK_SEPARATOR } from "./deck-format.policy"
import { parseDeckFields } from "./deck-format.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { parseDeckFields }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("review.deck-format-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

describe("parseDeckFields", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads plain fields and list fields, in LF and CRLF files", () => {
        const text = [
            "# title",
            DECK_SEPARATOR,
            "Module 1",
            DECK_SEPARATOR,
            "# tags",
            "## 0",
            DECK_SEPARATOR,
            "DI",
            DECK_SEPARATOR,
            "## 1",
            DECK_SEPARATOR,
            "Architecture",
            DECK_SEPARATOR,
            "# answer",
            DECK_SEPARATOR,
            "# not a field",
            "line two",
            DECK_SEPARATOR,
            "",
        ]

        const lf = subject.parseDeckFields(text.join("\n"))
        const crlf = subject.parseDeckFields(text.join("\r\n"))

        expect(lf.problems).toEqual([])
        expect(lf.fields).toEqual({ title: "Module 1", answer: "# not a field\nline two" })
        expect(lf.lists).toEqual({ tags: ["DI", "Architecture"] })
        expect(crlf.fields["title"]).toBe("Module 1")
    })

    it("names text outside a field and a list item before any field", () => {
        const found = subject.parseDeckFields(`stray\n## 0\n`)

        expect(found.problems).toEqual(["line 1: text outside a field", "line 2: text outside a field"])
    })

    it("names a field that does not start with the separator, and a field that is never closed", () => {
        const bad = subject.parseDeckFields(`# title\nno marker\n`)
        const open = subject.parseDeckFields(`# title\n${DECK_SEPARATOR}\nvalue\n`)

        expect(bad.problems[0]).toContain("does not start with the separator line")
        expect(open.problems).toEqual(["field title is not closed by the separator line"])
    })

    it("refuses a second list index inside a list header", () => {
        const found = subject.parseDeckFields(`# tags\n## 0\n## 1\n${DECK_SEPARATOR}\nx\n${DECK_SEPARATOR}\n`)

        expect(found.problems[0]).toContain("does not start with the separator line")
    })
})
