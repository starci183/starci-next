import { Test } from "@nestjs/testing"
import { documentOf, firstTitleOf, runBlocksOf, sectionsOf } from "./harness-markdown.policy"

const POLICY = Symbol("harness-markdown-policy")

const policies = { documentOf, firstTitleOf, runBlocksOf, sectionsOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("harness markdown", () => {
    it("splits the front matter from the text and reads an unreadable one as empty", async () => {
        const { documentOf: read } = await build()

        expect(read("---\ntitle: A\norder: 3\n---\nbody")).toEqual({ meta: { title: "A", order: 3 }, body: "body" })
        expect(read("no front matter").meta).toEqual({})
        expect(read("---\n: : :\n  - [\n---\nbody").body).toBe("body")
    })

    it("lists anchored headings of one level with the text under each", async () => {
        const { sectionsOf: sections } = await build()

        const found = sections("intro\n## One {#one}\na\n### Deep {#deep}\nb\n## Two {#two}\nc", 2)

        expect(found).toEqual([
            { id: "one", title: "One", body: "a\n### Deep {#deep}\nb" },
            { id: "two", title: "Two", body: "c" },
        ])
        expect(sections(found[0]?.body ?? "", 3)).toEqual([{ id: "deep", title: "Deep", body: "b" }])
    })

    it("does not read a heading inside a code fence and ends a section at an unanchored heading", async () => {
        const { sectionsOf: sections } = await build()

        const found = sections(
            "## One {#one}\n```md\n## Fake {#fake}\n```\n## Loose heading\nignored\n## Two {#two}\nc",
            2,
        )

        expect(found.map((section) => section.id)).toEqual(["one", "two"])
        expect(found[0]?.body).toContain("## Fake {#fake}")
        expect(found[0]?.body).not.toContain("ignored")
    })

    it("collects only the fenced blocks tagged run", async () => {
        const { runBlocksOf: blocks } = await build()

        expect(blocks("```run\nnpm ci\nnpm test\n```\n```ts\nconst a = 1\n```\n```run\necho hi\n```")).toEqual([
            "npm ci\nnpm test",
            "echo hi",
        ])
        expect(blocks("```run\n```")).toEqual([])
    })

    it("finds the first level-one title outside code, without its anchor", async () => {
        const { firstTitleOf: title } = await build()

        expect(title("```\n# not this\n```\n# The title {#x}\n## sub")).toBe("The title")
        expect(title("## only a sub")).toBeNull()
    })
})
