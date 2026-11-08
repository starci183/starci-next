import { Test } from "@nestjs/testing"
import { MOUNT_MARKER, parseMount } from "./mount.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { parseMount }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.mount.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const M = MOUNT_MARKER

describe("parseMount", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads a text field, a list of texts and a list of objects, in LF and CRLF", () => {
        const text = [
            "# title",
            M,
            "Hello",
            "# not a field inside the value",
            M,
            "# tags",
            "## 0",
            M,
            "a",
            M,
            "## 1",
            M,
            "b",
            M,
            "# checklist",
            "## 0",
            "### text",
            M,
            "t",
            M,
            "### critical",
            M,
            "true",
            M,
            "# empty",
            "",
        ].join("\n")

        for (const source of [text, text.replaceAll("\n", "\r\n")]) {
            const { fields, problems } = subject.parseMount(source)

            expect(problems).toEqual([])
            expect(fields).toEqual({
                title: "Hello\n# not a field inside the value",
                tags: ["a", "b"],
                checklist: [{ text: "t", critical: "true" }],
                empty: [],
            })
        }
    })
})

describe("parseMount (continued)", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reports text outside a field, a stray marker, a duplicate field, a field not closed and a misplaced sub-field", () => {
        const { problems } = subject.parseMount(
            [
                "junk",
                M,
                "# a",
                M,
                "x",
                M,
                "# a",
                M,
                "y",
                M,
                "### orphan",
                M,
                "z",
                M,
                "## 5",
                M,
                "q",
                M,
                "# open",
                M,
                "never closed",
            ].join("\n"),
        )

        expect(problems).toEqual([
            "line 1: text outside a field",
            "line 2: separator line outside a field",
            "field open is not closed by the separator line",
            "field a appears twice",
            "field orphan sits outside its list",
            "field 5 sits outside its list",
        ])
    })

    it("closes an unfinished file without naming a field when no header is pending", () => {
        const { problems } = subject.parseMount(["# a", M, "x"].join("\n"))

        expect(problems).toEqual(["field a is not closed by the separator line"])
    })
})
