import { chunkHashOf, type Chunk } from "./mcp-embedding.policy"
import type { McpEmbedder } from "./mcp-embedder.port"
import { McpMemoryVectorStore } from "./mcp-memory.vector-store"
import { McpUnconfiguredVectorStore } from "./mcp-unconfigured.vector-store"
import type { McpVectorStore } from "./mcp-vector-store.port"
import { McpVectorIndex, type McpCorpus } from "./mcp-vector.index"

/** A deterministic model: one dimension per letter, unit length. */
const vectorOf = (text: string): Array<number> => {
    const vector = new Array<number>(1024).fill(0)
    for (const char of text.toLowerCase()) vector[char.charCodeAt(0) % 64] = (vector[char.charCodeAt(0) % 64] ?? 0) + 1
    const norm = Math.hypot(...vector)
    return vector.map((value) => value / (norm === 0 ? 1 : norm))
}

const embedderOf = (model = "m/1024"): { embedder: McpEmbedder; calls: Array<ReadonlyArray<string>> } => {
    const calls: Array<ReadonlyArray<string>> = []
    return {
        calls,
        embedder: {
            isConfigured: true,
            model,
            embed: (texts) => {
                calls.push(texts)
                return Promise.resolve(texts.map(vectorOf))
            },
        },
    }
}

const chunk = (path: string, text: string): Chunk => ({ path, line: 1, text })
const corpus = (sourceId = "s", access: McpCorpus["access"] = "free"): McpCorpus => ({
    scope: { kind: "lesson", sourceId, locale: "vi" },
    access,
    readable: access === "free" ? ["free"] : ["free", "premium"],
})

describe("McpVectorIndex", () => {
    it("embeds a chunk once per content hash and reuses the stored vector on the next search", async () => {
        const { embedder, calls } = embedderOf()
        const index = new McpVectorIndex(embedder, new McpMemoryVectorStore())
        const chunks = [chunk("a", "apple pie"), chunk("b", "zzz qqq")]

        const first = await index.search(corpus(), chunks, "apple")
        expect(first?.[0]?.path).toBe("a")
        expect(calls[0]).toEqual(["apple pie", "zzz qqq"])

        await index.search(corpus(), chunks, "apple")
        // The second search embeds only the query: no chunk is embedded again.
        expect(calls.slice(1).flat().join("|")).not.toContain("apple pie")
    })

    it("embeds only the chunks that changed when a corpus changes (incremental by content hash)", async () => {
        const { embedder, calls } = embedderOf()
        const index = new McpVectorIndex(embedder, new McpMemoryVectorStore())
        await index.sync(corpus(), [chunk("a", "one"), chunk("b", "two")], true)
        const next = [chunk("a", "one"), chunk("b", "two changed"), chunk("c", "three")]
        const report = await index.sync(corpus(), next, true)

        expect(report).toEqual({ scope: "lesson:s:vi", chunks: 3, embedded: 2, reused: 1, pruned: 1 })
        expect(calls[1]).toEqual(["two changed", "three"])
        expect(await index.sync(corpus(), next, true)).toMatchObject({ embedded: 0, reused: 3, pruned: 0 })
    })

    it("re-embeds everything when the model changes, because the model is part of the hash", async () => {
        const store = new McpMemoryVectorStore()
        const old = embedderOf("old/1024")
        await new McpVectorIndex(old.embedder, store).sync(corpus(), [chunk("a", "one")], false)
        const next = embedderOf("new/1024")
        const report = await new McpVectorIndex(next.embedder, store).sync(corpus(), [chunk("a", "one")], false)
        expect(report?.embedded).toBe(1)
        expect(chunkHashOf("old/1024", "one")).not.toBe(chunkHashOf("new/1024", "one"))
    })

    it("returns only chunks of the corpus the caller passed, never a stored chunk the caller may not read", async () => {
        const { embedder } = embedderOf()
        const index = new McpVectorIndex(embedder, new McpMemoryVectorStore())
        // A premium reader stored both sections; a free reader passes only the unlocked one.
        const both = [chunk("section/1", "free text"), chunk("section/2", "SECRET locked text")]
        await index.search(corpus("s", "premium"), both, "locked")
        const hits = await index.search(corpus("s", "free"), [chunk("section/1", "free text")], "locked text secret")
        expect(hits?.map((hit) => hit.path)).toEqual(["section/1"])
        expect(JSON.stringify(hits)).not.toContain("SECRET")
    })

    it("opens a chunk a premium reader stored to free readers without embedding it again", async () => {
        const { embedder, calls } = embedderOf()
        const store = new McpMemoryVectorStore()
        const index = new McpVectorIndex(embedder, store)
        await index.search(corpus("s", "premium"), [chunk("section/1", "open text")], "open")
        const embeddedBefore = calls.flat().filter((text) => text === "open text").length

        const hits = await index.search(corpus("s", "free"), [chunk("section/1", "open text")], "open")
        expect(hits?.map((hit) => hit.path)).toEqual(["section/1"])
        expect(calls.flat().filter((text) => text === "open text")).toHaveLength(embeddedBefore)
    })

    it("reads the whole scope for a public corpus but still answers only chunks it holds the text of", async () => {
        const { embedder } = embedderOf()
        const index = new McpVectorIndex(embedder, new McpMemoryVectorStore())
        const harness: McpCorpus = {
            scope: { kind: "harness", sourceId: "harness", locale: "vi" },
            access: "free",
            readable: ["free"],
        }
        await index.sync(harness, [chunk("a", "old gone text")], false)
        const hits = await index.search(harness, [chunk("b", "new text")], "text", "scope")
        expect(hits?.map((hit) => hit.path)).toEqual(["b"])
    })

    it("answers null so the caller falls back to keywords when the embedder or the store is off or fails", async () => {
        const store = new McpMemoryVectorStore()
        const off: McpEmbedder = { isConfigured: false, model: "off", embed: () => Promise.resolve(null) }
        expect(await new McpVectorIndex(off, store).search(corpus(), [chunk("a", "x")], "x")).toBeNull()
        const down: McpEmbedder = { isConfigured: true, model: "down", embed: () => Promise.resolve(null) }
        expect(await new McpVectorIndex(down, store).search(corpus(), [chunk("a", "x")], "x")).toBeNull()
        expect(await new McpVectorIndex(down, store).sync(corpus(), [chunk("a", "x")], true)).toBeNull()

        const none = new McpVectorIndex(embedderOf().embedder, new McpUnconfiguredVectorStore())
        expect(none.isConfigured).toBe(false)
        expect(await none.search(corpus(), [chunk("a", "x")], "x")).toBeNull()

        const broken: McpVectorStore = {
            isConfigured: true,
            known: () => Promise.reject(new Error("qdrant down")),
            put: () => Promise.resolve(),
            retag: () => Promise.resolve(),
            nearest: () => Promise.resolve([]),
            prune: () => Promise.resolve(0),
        }
        expect(
            await new McpVectorIndex(embedderOf().embedder, broken).search(corpus(), [chunk("a", "x")], "x"),
        ).toBeNull()
    })
})
