import { Test } from "@nestjs/testing"
import { SEPARATOR_LINE } from "@tests/fixtures/builders/lesson.builder"
import { parseSeparatorFields } from "./separator.policy"

const SEPARATOR_POLICY: unique symbol = Symbol("lesson.separator-policy")

const build = async (): Promise<typeof parseSeparatorFields> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SEPARATOR_POLICY, useFactory: () => parseSeparatorFields }],
    }).compile()
    return moduleRef.get<typeof parseSeparatorFields>(SEPARATOR_POLICY)
}

const field = (name: string, ...lines: Array<string>): string =>
    [`# ${name}`, SEPARATOR_LINE, ...lines, SEPARATOR_LINE, ""].join("\n")

describe("parseSeparatorFields", () => {
    it("reads each field as the exact lines between its two marker lines", async () => {
        const parse = await build()

        expect(parse(`${field("title", "A title")}\n${field("body", "## Heading", "", "text")}`)).toEqual({
            fields: { title: "A title", body: "## Heading\n\ntext" },
            problems: [],
        })
    })

    it("keeps a level-one heading inside a value as part of the value", async () => {
        const parse = await build()

        expect(parse(field("body", "# not a field", "more")).fields).toEqual({ body: "# not a field\nmore" })
    })

    it("reads a file written with Windows line breaks the same way", async () => {
        const parse = await build()

        expect(parse(field("title", "One").replaceAll("\n", "\r\n")).fields).toEqual({ title: "One" })
    })

    it("reports text outside a field with its line number", async () => {
        const parse = await build()

        expect(parse(`stray\n${field("title", "One")}`).problems).toEqual(["line 1: text outside a field"])
    })

    it("reports a field that appears twice and keeps the first value", async () => {
        const parse = await build()
        const result = parse(`${field("title", "One")}${field("title", "Two")}`)

        expect(result.fields).toEqual({ title: "One" })
        expect(result.problems[0]).toBe("line 5: field title appears twice")
    })

    it("reports a header that is not followed by the separator line", async () => {
        const parse = await build()

        expect(parse("# title\nOne\n").problems).toEqual(["line 2: field title does not start with the separator line"])
    })

    it("reports a field that is never closed, and a header with nothing after it", async () => {
        const parse = await build()

        expect(parse(`# title\n${SEPARATOR_LINE}\nOne`).problems).toEqual([
            "field title is not closed by the separator line",
        ])
        expect(parse("# title").problems).toEqual(["field title is not closed by the separator line"])
    })
})
