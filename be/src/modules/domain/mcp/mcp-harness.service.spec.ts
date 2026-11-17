import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { FakeClock } from "@starci/jest-preset"
import type { McpEmbedder } from "./mcp-embedder.port"
import { McpHarnessDiskSource } from "./mcp-harness-disk.source"
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

describe("McpHarnessService over a content checkout on disk", () => {
    let dir = ""
    const put = (path: string, text: string): void => {
        mkdirSync(dirname(join(dir, path)), { recursive: true })
        writeFileSync(join(dir, path), text)
    }

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), "mcp-harness-"))
        put("raw/harness/guides/claude/hooks/vi.md", "Hook chay truoc moi lan goi tool")
        put("raw/harness/guides/claude/hooks/en.md", "A hook runs before every tool call")
        put("raw/harness/docs/overview/vi.md", "Tong quan ve harness")
        put("raw/harness/build/agent-cli/hidden/vi.md", "HIDDENBUILDSECRET Hook")
        put("raw/harness/trials/trap/trap.yaml", "HIDDENTRAPSECRET")
    })
    afterEach(() => rmSync(dir, { recursive: true, force: true }))

    const make = (harnessDir: string | null, port: McpEmbedder): McpHarnessService => {
        const clock = new FakeClock("2026-11-17T00:00:00.000Z")
        const source = new McpHarnessDiskSource({ embed: null, harnessDir, qdrant: null })
        return new McpHarnessService(source, new McpVectorIndex(port, new McpMemoryVectorStore()), clock)
    }

    it("finds guides and docs by keyword in the asked locale and never a build or trial part", async () => {
        const service = make(dir, embedderOf().embedder)
        const vi = await service.search("vi", "hook", false)
        expect(vi.mode).toBe("keyword")
        expect(vi.hits.map((hit) => hit.path)).toEqual(["guides/claude/hooks"])
        expect((await service.search("en", "hook", false)).hits[0]?.text).toContain("A hook runs")
        expect(JSON.stringify(await service.search("vi", "SECRET", false))).not.toContain("SECRET")
    })

    it("answers empty when no content checkout is declared", async () => {
        expect(await make(null, embedderOf().embedder).search("vi", "hook", false)).toMatchObject({ hits: [] })
    })

    it("searches semantically when the embedder answers and falls back to keywords when it is off", async () => {
        const { embedder, texts } = embedderOf()
        const semantic = await make(dir, embedder).search("vi", "hook chay truoc tool", true)
        expect(semantic.mode).toBe("semantic")
        expect(semantic.hits.map((hit) => hit.path)).toEqual(
            expect.arrayContaining(["guides/claude/hooks", "docs/overview"]),
        )
        expect(texts.join("\n")).not.toContain("HIDDEN")
        const off = make(dir, { isConfigured: false, model: "off", embed: () => Promise.resolve(null) })
        expect(await off.search("vi", "hook", true)).toMatchObject({ mode: "keyword", fellBack: true })
    })

    it("reindexes incrementally: a second run embeds nothing, a changed file embeds only its chunks, a removed file is pruned", async () => {
        const { embedder, texts } = embedderOf()
        const service = make(dir, embedder)

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

        put("raw/harness/docs/overview/vi.md", "Tong quan moi ve harness")
        rmSync(join(dir, "raw/harness/guides/claude/hooks/vi.md"))
        const third = await service.reindex()
        expect(third.scopes[0]).toMatchObject({ scope: "harness:harness:vi", embedded: 1, reused: 0, pruned: 2 })
        expect(texts).toEqual(["harness/docs/overview · docs/overview\nTong quan moi ve harness"])
    })
})
