import { QdrantErrorCode, VECTOR_INDEX, type VectorIndex } from "@modules/integrations/qdrant"
import { QDRANT_WORLD, qdrantModules } from "../../world/qdrant-world.options"
import { useTestWorld } from "../../world/use-test-world"

const POINTS = [
    { pointId: "00000000-0000-4000-8000-000000000001", vector: [1, 0, 0], payload: { scope: "a" } },
    { pointId: "00000000-0000-4000-8000-000000000002", vector: [0.9, 0.1, 0], payload: { scope: "a" } },
    { pointId: "00000000-0000-4000-8000-000000000003", vector: [1, 0, 0], payload: { scope: "b" } },
]

/**
 * qdrant (integration): the vector index client against the world's Qdrant fake. It proves the collection is prepared once and
 * the points are stored and searched by cosine under a mandatory filter, that removed points leave the search, and that a refusing or silent service refuses as the coded
 * QdrantErrorCode.
 */
describe("qdrant (integration)", () => {
    const world = useTestWorld({ modules: qdrantModules })
    const index = (): VectorIndex => world.resolve<VectorIndex>(VECTOR_INDEX)

    beforeEach(async () => {
        await world.fake.qdrant?.reset()
    })

    it("prepares the collection with the app's vector size and sends the api key", async () => {
        await index().ensure()
        await index().ensure()

        const recorded = (await world.fake.qdrant?.requests()) ?? []
        const creates = recorded.filter(
            (entry) => entry.method === "PUT" && entry.path.endsWith(QDRANT_WORLD.collection),
        )
        expect(creates).toHaveLength(1)
        expect(creates[0]?.body).toContain(`"size":${String(QDRANT_WORLD.dimensions)}`)
        expect(recorded[0]?.headers["api-key"]).toBeTruthy()
    })

    it("stores points and answers the nearest of the filtered scope, nearest first", async () => {
        await index().ensure()
        await index().upsert(POINTS)

        const matches = await index().search([{ key: "scope", any: ["a"] }], [1, 0, 0], 10)

        expect(matches.map((match) => match.pointId)).toEqual([POINTS[0]?.pointId, POINTS[1]?.pointId])
        expect(matches[0]?.score).toBeGreaterThan(matches[1]?.score ?? 1)
    })

    it("moves points to another scope and forgets removed points", async () => {
        await index().ensure()
        await index().upsert(POINTS)
        await index().setPayload([POINTS[1]?.pointId ?? ""], { scope: "b" })
        await index().remove([POINTS[0]?.pointId ?? ""])

        const scopeA = await index().search([{ key: "scope", any: ["a"] }], [1, 0, 0], 10)
        const scopeB = await index().search([{ key: "scope", any: ["b"] }], [1, 0, 0], 10)

        expect(scopeA).toEqual([])
        expect(scopeB.map((match) => match.pointId).sort()).toEqual([POINTS[1]?.pointId, POINTS[2]?.pointId].sort())
    })

    it("refuses a search without a filter as QDRANT_SCOPE_MISSING", async () => {
        await expect(index().search([], [1, 0, 0], 5)).rejects.toMatchObject({ code: QdrantErrorCode.ScopeMissing })
    })

    it("refuses with QDRANT_REJECTED when the service refuses and QDRANT_UNAVAILABLE when it stays silent", async () => {
        await world.fake.qdrant?.failNext({ status: 503, times: 1 })
        await expect(index().ensure()).rejects.toMatchObject({ code: QdrantErrorCode.Rejected })

        await world.fake.qdrant?.failNext({ timeout: true, times: 1 })
        await expect(index().ensure()).rejects.toMatchObject({ code: QdrantErrorCode.Unavailable })
    })
})
