import { Test } from "@nestjs/testing"
import * as subject from "./practice-format.policy"
import { PRACTICE_MARKER } from "./practice-format.policy"

const SUBJECT: unique symbol = Symbol("practice.practice-format.policy")

describe("splitBlocks and blocksOf", () => {
    let blocksOf: typeof subject.blocksOf
    let splitBlocks: typeof subject.splitBlocks

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ blocksOf, splitBlocks } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("splits a text at its headings of one level and keeps the lines before the first as the head", () => {
        const { head, blocks } = blocksOf("intro\n# one\nfirst\n# two\nsecond\nmore", 1)

        expect(head).toEqual(["intro"])
        expect(blocks.map((block) => block.name)).toEqual(["one", "two"])
        expect(blocks[1]?.lines).toEqual(["second", "more"])
    })

    it("never splits at a heading inside a protected value, the marker lines included in the block", () => {
        const text = `# code\n${PRACTICE_MARKER}\n# not a heading\n## nor this\n${PRACTICE_MARKER}\n# next\nvalue`

        const { blocks } = blocksOf(text, 1)

        expect(blocks.map((block) => block.name)).toEqual(["code", "next"])
        expect(blocks[0]?.lines).toEqual([PRACTICE_MARKER, "# not a heading", "## nor this", PRACTICE_MARKER])
    })

    it("splits at the exact level only and reads CRLF text", () => {
        const { blocks } = blocksOf("# top\r\n## sub a\r\nx\r\n### deep\r\n## sub b", 2)

        expect(blocks.map((block) => block.name)).toEqual(["sub a", "sub b"])
        expect(splitBlocks(["### only"], 3).blocks.map((block) => block.name)).toEqual(["only"])
    })
})

describe("valueOf", () => {
    let valueOf: typeof subject.valueOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ valueOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("reads the lines between the first two marker lines exactly, minus the blank lines at the edges", () => {
        const lines = ["", PRACTICE_MARKER, "", "  1 2", "", "3 4", "", PRACTICE_MARKER, "after"]

        expect(valueOf(lines)).toBe("  1 2\n\n3 4")
    })

    it("reads an empty protected value as an empty text", () => {
        expect(valueOf([PRACTICE_MARKER, PRACTICE_MARKER])).toBe("")
    })

    it("reads the trimmed text of a block with no markers or only one", () => {
        expect(valueOf(["", " medium ", ""])).toBe("medium")
        expect(valueOf([PRACTICE_MARKER, "open"])).toBe(`${PRACTICE_MARKER}\nopen`)
    })
})

describe("blockNamed", () => {
    let blockNamed: typeof subject.blockNamed
    let blocksOf: typeof subject.blocksOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ blockNamed, blocksOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("finds a block by name and answers undefined for another", () => {
        const { blocks } = blocksOf("# a\n1\n# b\n2", 1)

        expect(blockNamed(blocks, "b")?.lines).toEqual(["2"])
        expect(blockNamed(blocks, "c")).toBeUndefined()
    })
})

describe("hintStepsOf", () => {
    let hintStepsOf: typeof subject.hintStepsOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ hintStepsOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("splits the hint at its muted blocks: the line inside names the step, the prose runs to the next block", () => {
        const hint = ":::muted\nAnalysis\n:::\nline one\nline two\n\n:::muted\nApproach\n:::\nwalk it\n"

        expect(hintStepsOf(hint)).toEqual([
            { title: "Analysis", markdown: "line one\nline two" },
            { title: "Approach", markdown: "walk it" },
        ])
    })

    it("ignores text before the first block and a muted line that does not open a block", () => {
        const hint = "preface\n:::muted\nA\n:::\nbody\n:::muted\nno close\nstill body"

        expect(hintStepsOf(hint)).toEqual([{ title: "A", markdown: "body\n:::muted\nno close\nstill body" }])
    })

    it("answers no step for a text with no muted block", () => {
        expect(hintStepsOf("just text")).toEqual([])
    })
})
