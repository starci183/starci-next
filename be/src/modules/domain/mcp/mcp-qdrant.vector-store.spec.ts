import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import type { VectorIndex } from "@modules/integrations/qdrant"
import { McpQdrantVectorStore, pointIdOf } from "./mcp-qdrant.vector-store"
import type { McpScope } from "./mcp-vector-store.port"

const NOW = "2026-11-17T00:00:00.000Z"
const SCOPE: McpScope = { kind: "lesson", sourceId: "bank-transfer", locale: "vi" }

const make = (
    answer: (text: string) => unknown = () => [],
): { store: McpQdrantVectorStore; query: jest.Mock; index: jest.Mocked<VectorIndex> } => {
    const manager = mockEntityManager()
    const query = jest.fn().mockImplementation((text: string) => Promise.resolve(answer(text)))
    Object.assign(manager, { query })
    const index: jest.Mocked<VectorIndex> = {
        ensure: jest.fn().mockResolvedValue(undefined),
        upsert: jest.fn().mockResolvedValue(undefined),
        setPayload: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
        search: jest.fn().mockResolvedValue([]),
    }
    return { store: new McpQdrantVectorStore(manager, index, new FakeClock(NOW)), query, index }
}

describe("pointIdOf", () => {
    it("is a stable UUID of the scope and the hash, different for another scope or hash", () => {
        const id = pointIdOf(SCOPE, "h1")
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u)
        expect(pointIdOf(SCOPE, "h1")).toBe(id)
        expect(pointIdOf(SCOPE, "h2")).not.toBe(id)
        expect(pointIdOf({ ...SCOPE, locale: "en" }, "h1")).not.toBe(id)
    })
})

describe("McpQdrantVectorStore", () => {
    it("asks Postgres which synced chunks it holds, and nothing for an empty list", async () => {
        const { store, query } = make(() => [{ content_hash: "h1", access: "free" }])
        expect(await store.known(SCOPE, [])).toEqual(new Map())
        expect(query).not.toHaveBeenCalled()
        expect([...(await store.known(SCOPE, ["h1", "h2"]))]).toEqual([["h1", "free"]])
        expect(String(query.mock.calls[0]?.[0])).toContain("synced_at IS NOT NULL")
        expect(query.mock.calls[0]?.[1]).toEqual(["lesson", "bank-transfer", "vi", ["h1", "h2"]])
    })

    it("writes pending rows, then the Qdrant points carrying keywords only, then the sync time", async () => {
        const { store, query, index } = make()
        const order: Array<string> = []
        query.mockImplementation((text: string) => {
            order.push(text.includes("INSERT") ? "rows" : "synced")
            return Promise.resolve([])
        })
        index.upsert.mockImplementation(() => {
            order.push("points")
            return Promise.resolve()
        })

        await store.put(SCOPE, [{ hash: "h1", vector: [1, 0], part: "section/1" }], "free")

        expect(order).toEqual(["rows", "points", "synced"])
        expect(index.ensure).toHaveBeenCalledTimes(1)
        const point = index.upsert.mock.calls[0]?.[0][0]
        expect(point?.pointId).toBe(pointIdOf(SCOPE, "h1"))
        expect(point?.payload).toEqual({
            kind: "lesson",
            source_id: "bank-transfer",
            locale: "vi",
            access: "free",
            hash: "h1",
            part: "section/1",
        })
        expect(JSON.stringify(point)).not.toContain("text")
        await store.put(SCOPE, [{ hash: "h2", vector: [1, 0], part: "section/2" }], "free")
        expect(index.ensure).toHaveBeenCalledTimes(1)
    })

    it("leaves the row pending when Qdrant is down, so the next job writes it again", async () => {
        const { store, query, index } = make()
        index.upsert.mockRejectedValue(new Error("qdrant down"))
        await expect(store.put(SCOPE, [{ hash: "h1", vector: [1], part: "p" }], "free")).rejects.toThrow("qdrant down")
        expect(query.mock.calls.map((call) => String(call[0]).includes("synced_at = $2"))).not.toContain(true)
    })

    it("searches Qdrant under a payload filter of scope, access classes and hashes, then reads the hashes back", async () => {
        const id = pointIdOf(SCOPE, "h1")
        const { store, index } = make(() => [{ point_id: id, content_hash: "h1" }])
        index.search.mockResolvedValue([
            { pointId: id, score: 0.9 },
            { pointId: "gone", score: 0.5 },
        ])

        const near = await store.nearest(SCOPE, [1, 0], 5, ["free"], ["h1", "h2"])

        expect(near).toEqual([{ hash: "h1", score: 0.9 }])
        expect(index.search).toHaveBeenCalledWith(
            [
                { key: "kind", any: ["lesson"] },
                { key: "source_id", any: ["bank-transfer"] },
                { key: "locale", any: ["vi"] },
                { key: "access", any: ["free"] },
                { key: "hash", any: ["h1", "h2"] },
            ],
            [1, 0],
            5,
        )
    })

    it("leaves the hash filter out for a public corpus read whole, and never the scope or access conditions", async () => {
        const { store, index } = make()
        await store.nearest({ kind: "harness", sourceId: "harness", locale: "en" }, [1], 3, ["free"], null)
        const must = index.search.mock.calls[0]?.[0] ?? []
        expect(must.map((condition) => condition.key)).toEqual(["kind", "source_id", "locale", "access"])
    })

    it("re-labels access in Postgres and in Qdrant without touching the vectors", async () => {
        const { store, index } = make(() => [{ point_id: "p1" }, { point_id: "p2" }])
        await store.retag(SCOPE, ["h1", "h2"], "free")
        expect(index.setPayload).toHaveBeenCalledWith(["p1", "p2"], { access: "free" })
        expect(index.upsert).not.toHaveBeenCalled()
    })

    it("prunes the stale points from Qdrant first, then their rows", async () => {
        const order: Array<string> = []
        const { store, query, index } = make()
        query.mockImplementation((text: string) => {
            order.push(text.includes("DELETE") ? "rows" : "select")
            return Promise.resolve(text.includes("DELETE") ? [] : [{ point_id: "p1" }])
        })
        index.remove.mockImplementation(() => {
            order.push("points")
            return Promise.resolve()
        })
        expect(await store.prune(SCOPE, ["keep"])).toBe(1)
        expect(order).toEqual(["select", "points", "rows"])
    })
})
