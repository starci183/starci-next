import { FakeClock } from "@starci/jest-preset"
import type { McpEmbedder } from "./mcp-embedder.port"
import type { McpHarnessFile } from "./mcp-harness.policy"
import { McpHarnessService } from "./mcp-harness.service"
import { McpMemoryVectorStore } from "./mcp-memory.vector-store"
import { McpVectorIndex } from "./mcp-vector.index"

const embedderOf = (): { embedder: McpEmbedder; texts: Array<string> } => {
    const texts: Array<string> = []
    return {
        texts,
        embedder: {
            isConfigured: true,
            model: "m/1024",
            embed: (batch) => {
                texts.push(...batch)
                return Promise.resolve(
                    batch.map((text) => {
                        const vector = new Array<number>(1024).fill(0)
                        for (const char of text.toLowerCase())
                            vector[char.charCodeAt(0) % 64] = 1 + (vector[char.charCodeAt(0) % 64] ?? 0)
                        const norm = Math.hypot(...vector)
                        return vector.map((value) => value / (norm === 0 ? 1 : norm))
                    }),
                )
            },
        },
    }
}

describe("McpHarnessService over the stored guides and docs", () => {
    let files: Array<McpHarnessFile> = []
    const put = (path: string, text: string): void => {
        files = [...files.filter((file) => file.path !== path), { path, text }]
    }

    beforeEach(() => {
        files = []
        put("harness/guides/claude/hooks/vi.md", "Hook chay truoc moi lan goi tool")
        put("harness/guides/claude/hooks/en.md", "A hook runs before every tool call")
        put("harness/docs/overview/vi.md", "Tong quan ve harness")
        put("harness/build/agent-cli/hidden/vi.md", "HIDDENBUILDSECRET Hook")
        put("harness/trials/trap/trap.yaml", "HIDDENTRAPSECRET")
    })

    const make = (list: ReadonlyArray<McpHarnessFile>, port: McpEmbedder): McpHarnessService => {
        const clock = new FakeClock("2026-11-17T00:00:00.000Z")
        return new McpHarnessService(
            { files: () => Promise.resolve(list) },
            new McpVectorIndex(port, new McpMemoryVectorStore()),
            clock,
        )
    }

    it("finds guides and docs by keyword in the asked locale and never a build or trial part", async () => {
        const service = make(files, embedderOf().embedder)
        const vi = await service.search("vi", "hook", false)
        expect(vi.mode).toBe("keyword")
        expect(vi.hits.map((hit) => hit.path)).toEqual(["guides/claude/hooks"])
        expect((await service.search("en", "hook", false)).hits[0]?.text).toContain("A hook runs")
        expect(JSON.stringify(await service.search("vi", "SECRET", false))).not.toContain("SECRET")
    })

    it("answers empty when the store holds no guide or doc", async () => {
        expect(await make([], embedderOf().embedder).search("vi", "hook", false)).toMatchObject({ hits: [] })
    })

    it("searches semantically when the embedder answers and falls back to keywords when it is off", async () => {
        const { embedder, texts } = embedderOf()
        const semantic = await make(files, embedder).search("vi", "hook chay truoc tool", true)
        expect(semantic.mode).toBe("semantic")
        expect(semantic.hits.map((hit) => hit.path)).toEqual(
            expect.arrayContaining(["guides/claude/hooks", "docs/overview"]),
        )
        expect(texts.join("\n")).not.toContain("HIDDEN")
        const off = make(files, { isConfigured: false, model: "off", embed: () => Promise.resolve(null) })
        expect(await off.search("vi", "hook", true)).toMatchObject({ mode: "keyword", fellBack: true })
    })

    it("reindexes incrementally: a second run embeds nothing, a changed page embeds only its chunks, a removed page is pruned", async () => {
        const { embedder, texts } = embedderOf()
        let current: ReadonlyArray<McpHarnessFile> = files
        const clock = new FakeClock("2026-11-17T00:00:00.000Z")
        const service = new McpHarnessService(
            { files: () => Promise.resolve(current) },
            new McpVectorIndex(embedder, new McpMemoryVectorStore()),
            clock,
        )

        const first = await service.reindex()
        expect(first.documents).toBe(3)
        expect(first.scopes.map((scope) => [scope.scope, scope.embedded])).toEqual([
            ["harness:harness:vi", 2],
            ["harness:harness:en", 1],
        ])

        texts.length = 0
        const second = await service.reindex()
        expect(second.scopes.every((scope) => scope.embedded === 0 && scope.pruned === 0)).toBe(true)
        expect(texts).toEqual([])

        put("harness/docs/overview/vi.md", "Tong quan moi ve harness")
        current = files.filter((file) => file.path !== "harness/guides/claude/hooks/vi.md")
        const third = await service.reindex()
        expect(third.scopes[0]).toMatchObject({ scope: "harness:harness:vi", embedded: 1, reused: 0, pruned: 2 })
        expect(texts).toEqual(["harness/docs/overview · docs/overview\nTong quan moi ve harness"])
    })
})
