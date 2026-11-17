import type { HttpClient } from "@modules/platform/http"
import { QdrantClient } from "./qdrant.client"
import { QdrantError, QdrantErrorCode } from "./errors/qdrant.error"
import type { QdrantOptions } from "./qdrant.options"

const options: QdrantOptions = {
    url: "http://127.0.0.1:3293",
    apiKey: null,
    timeoutMs: 5000,
    collection: "starci-next",
    dimensions: 1024,
    payloadIndexes: ["kind", "access"],
}

const make = (
    answers: Array<{ status: number; body?: unknown } | Error>,
): { client: QdrantClient; request: jest.Mock } => {
    const request = jest.fn().mockImplementation(() => {
        const next = answers.shift() ?? { status: 200, body: {} }
        return next instanceof Error ? Promise.reject(next) : Promise.resolve(next)
    })
    return { client: new QdrantClient({ request } as unknown as HttpClient, options), request }
}

describe("QdrantClient", () => {
    it("creates the collection with the declared size and cosine distance, then the payload indexes", async () => {
        const { client, request } = make([{ status: 200, body: { result: { exists: false } } }])
        await client.ensure()
        const calls = request.mock.calls.map((call) => [call[0].method, call[0].url.replace(options.url, "")])
        expect(calls).toEqual([
            ["GET", "/collections/starci-next/exists"],
            ["PUT", "/collections/starci-next"],
            ["PUT", "/collections/starci-next/index?wait=true"],
            ["PUT", "/collections/starci-next/index?wait=true"],
        ])
        expect(request.mock.calls[1]?.[0].body).toEqual({
            vectors: { size: 1024, distance: "Cosine" },
            on_disk_payload: true,
        })
        expect(request.mock.calls[2]?.[0].body).toEqual({ field_name: "kind", field_schema: "keyword" })
    })

    it("refuses a collection of another vector size", async () => {
        const { client } = make([
            { status: 200, body: { result: { exists: true } } },
            { status: 200, body: { result: { config: { params: { vectors: { size: 768, distance: "Cosine" } } } } } },
        ])
        await expect(client.ensure()).rejects.toMatchObject({ code: QdrantErrorCode.Mismatch })
    })

    it("upserts points in batches with only keyword payload and no text", async () => {
        const { client, request } = make([])
        await client.upsert(
            Array.from({ length: 130 }, (_, index) => ({
                pointId: `id${index}`,
                vector: [1],
                payload: { kind: "lesson" },
            })),
        )
        expect(request).toHaveBeenCalledTimes(2)
        expect(request.mock.calls[0]?.[0].body.points).toHaveLength(128)
        expect(request.mock.calls[0]?.[0].body.points[0]).toEqual({
            id: "id0",
            vector: [1],
            payload: { kind: "lesson" },
        })
    })

    it("searches under a mandatory filter and answers ids with scores", async () => {
        const { client, request } = make([
            { status: 200, body: { result: { points: [{ id: "p1", score: 0.8 }, { id: 7 }] } } },
        ])
        const found = await client.search(
            [
                { key: "kind", any: ["lesson"] },
                { key: "access", any: ["free", "premium"] },
            ],
            [1, 0],
            500,
        )
        expect(found).toEqual([{ pointId: "p1", score: 0.8 }])
        const body = request.mock.calls[0]?.[0].body
        expect(body.limit).toBe(100)
        expect(body.filter).toEqual({
            must: [
                { key: "kind", match: { value: "lesson" } },
                { key: "access", match: { any: ["free", "premium"] } },
            ],
        })
        expect(body.with_payload).toBe(false)
    })

    it("refuses an unfiltered search and a condition with no value", async () => {
        const { client, request } = make([])
        await expect(client.search([], [1], 5)).rejects.toMatchObject({ code: QdrantErrorCode.ScopeMissing })
        await expect(client.search([{ key: "kind", any: [] }], [1], 5)).rejects.toBeInstanceOf(QdrantError)
        expect(request).not.toHaveBeenCalled()
    })

    it("answers QDRANT_UNAVAILABLE for a network failure and QDRANT_REJECTED for a refusal", async () => {
        const down = make([new Error("ECONNREFUSED")])
        await expect(down.client.remove(["p1"])).rejects.toMatchObject({ code: QdrantErrorCode.Unavailable })
        const refused = make([{ status: 500 }])
        await expect(refused.client.setPayload(["p1"], { access: "free" })).rejects.toMatchObject({
            code: QdrantErrorCode.Rejected,
        })
    })
})
