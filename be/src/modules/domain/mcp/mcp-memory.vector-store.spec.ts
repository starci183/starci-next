import { McpMemoryVectorStore } from "./mcp-memory.vector-store"
import type { McpScope } from "./mcp-vector-store.port"

const A: McpScope = { kind: "lesson", sourceId: "a", locale: "vi" }
const B: McpScope = { kind: "lesson", sourceId: "b", locale: "vi" }
const chunk = (hash: string, vector: Array<number>): { hash: string; vector: Array<number>; part: string } => ({
    hash,
    vector,
    part: "p",
})

describe("McpMemoryVectorStore", () => {
    it("keeps vectors per scope, ranks by cosine and restricts to the hashes asked", async () => {
        const store = new McpMemoryVectorStore()
        await store.put(A, [chunk("x", [1, 0]), chunk("y", [0, 1])], "free")
        await store.put(B, [chunk("z", [1, 0])], "free")

        expect((await store.nearest(A, [1, 0], 5, ["free"], null)).map((hit) => hit.hash)).toEqual(["x", "y"])
        expect((await store.nearest(A, [1, 0], 5, ["free"], ["y"])).map((hit) => hit.hash)).toEqual(["y"])
        expect([...(await store.known(A, ["x", "z"]))]).toEqual([["x", "free"]])
        expect(await store.nearest({ ...A, sourceId: "none" }, [1, 0], 5, ["free"], null)).toEqual([])
    })

    it("gates by access class and re-labels without embedding again", async () => {
        const store = new McpMemoryVectorStore()
        await store.put(A, [chunk("free-1", [1, 0])], "free")
        await store.put(A, [chunk("prem-1", [1, 0])], "premium")

        expect((await store.nearest(A, [1, 0], 5, ["free"], null)).map((hit) => hit.hash)).toEqual(["free-1"])
        expect((await store.nearest(A, [1, 0], 5, ["free", "premium"], null)).map((hit) => hit.hash).sort()).toEqual([
            "free-1",
            "prem-1",
        ])
        await store.retag(A, ["prem-1"], "free")
        expect((await store.nearest(A, [1, 0], 5, ["free"], null)).map((hit) => hit.hash).sort()).toEqual([
            "free-1",
            "prem-1",
        ])
    })

    it("keeps the first vector of a hash and prunes what is outside the kept hashes", async () => {
        const store = new McpMemoryVectorStore()
        await store.put(A, [chunk("x", [1, 0])], "free")
        await store.put(A, [chunk("x", [0, 1]), chunk("y", [0, 1])], "free")
        expect((await store.nearest(A, [1, 0], 1, ["free"], null))[0]?.hash).toBe("x")
        expect(await store.prune(A, ["x"])).toBe(1)
        expect(await store.prune({ ...A, sourceId: "missing" }, [])).toBe(0)
        expect([...(await store.known(A, ["x", "y"])).keys()]).toEqual(["x"])
    })
})
