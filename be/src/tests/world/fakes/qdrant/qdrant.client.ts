import {
    defineHttpFake,
    type FakeClient,
    type FakeDefinition,
    type FakeHttpReply,
    type FakeHttpRequest,
    type HttpFakeContext,
} from "@starci/test-world/fakes"

/** One stored point of the fake: its vector and the payload keywords the filters read. */
interface StoredPoint {
    vector: ReadonlyArray<number>
    payload: Record<string, string>
}

/** One collection of the fake: its shape and its points by id. */
interface StoredCollection {
    readonly size: number
    readonly distance: string
    readonly points: Map<string, StoredPoint>
}

/** The collections the fake holds, by name. */
interface QdrantFakeState {
    readonly collections: Map<string, StoredCollection>
}

type QdrantFakeContext = HttpFakeContext<QdrantFakeState, undefined>

const isJson = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const ok = (result: unknown = { status: "acknowledged" }): FakeHttpReply => ({ body: { result, status: "ok" } })

const refusal = (status: number): FakeHttpReply => ({ status, body: { status: { error: "refused" } } })

const keyed = (request: FakeHttpRequest, context: QdrantFakeContext): boolean =>
    request.headers["api-key"] === context.secret("qdrant-api-key")

const collectionOf = (request: FakeHttpRequest, context: QdrantFakeContext): StoredCollection | undefined =>
    context.state.collections.get(request.params["collection"] ?? "")

/** The cosine similarity of two vectors of the same size; 0 when either has no length. */
const cosine = (left: ReadonlyArray<number>, right: ReadonlyArray<number>): number => {
    let dot = 0
    let a = 0
    let b = 0
    left.forEach((value, index) => {
        const other = right[index] ?? 0
        dot += value * other
        a += value * value
        b += other * other
    })
    return a === 0 || b === 0 ? 0 : dot / Math.sqrt(a * b)
}

/** Whether a point satisfies every `must` condition of a filter (`match.value` or `match.any` on one payload key). */
const satisfies = (point: StoredPoint, filter: unknown): boolean => {
    const must = isJson(filter) && Array.isArray(filter["must"]) ? filter["must"] : []
    return must.every((condition: unknown) => {
        if (!isJson(condition) || !isJson(condition["match"])) return false
        const held = point.payload[String(condition["key"])]
        const { value, any } = condition["match"]
        return Array.isArray(any) ? any.includes(held) : held === value
    })
}

const exists = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply =>
    keyed(request, context) ? ok({ exists: collectionOf(request, context) !== undefined }) : refusal(403)

const describe = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply => {
    if (!keyed(request, context)) return refusal(403)
    const found = collectionOf(request, context)
    return found === undefined
        ? refusal(404)
        : ok({ config: { params: { vectors: { size: found.size, distance: found.distance } } } })
}

const create = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply => {
    if (!keyed(request, context)) return refusal(403)
    const body = request.json()
    const vectors = isJson(body) ? body["vectors"] : undefined
    if (!isJson(vectors) || typeof vectors["size"] !== "number" || typeof vectors["distance"] !== "string")
        return refusal(422)
    const name = request.params["collection"] ?? ""
    if (context.state.collections.has(name)) return refusal(409)
    context.state.collections.set(name, { size: vectors["size"], distance: vectors["distance"], points: new Map() })
    return ok(true)
}

const index = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply =>
    !keyed(request, context) ? refusal(403) : collectionOf(request, context) === undefined ? refusal(404) : ok()

const upsert = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply => {
    const found = collectionOf(request, context)
    if (!keyed(request, context)) return refusal(403)
    if (found === undefined) return refusal(404)
    const body = request.json()
    const points = isJson(body) && Array.isArray(body["points"]) ? body["points"] : []
    for (const entry of points) {
        if (!isJson(entry) || typeof entry["id"] !== "string" || !Array.isArray(entry["vector"])) return refusal(422)
        found.points.set(entry["id"], {
            vector: entry["vector"].map(Number),
            payload: isJson(entry["payload"]) ? (entry["payload"] as Record<string, string>) : {},
        })
    }
    return ok()
}

const setPayload = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply => {
    const found = collectionOf(request, context)
    if (!keyed(request, context)) return refusal(403)
    if (found === undefined) return refusal(404)
    const body = request.json()
    const ids = isJson(body) && Array.isArray(body["points"]) ? body["points"].map(String) : []
    const payload = isJson(body) && isJson(body["payload"]) ? (body["payload"] as Record<string, string>) : {}
    for (const id of ids) {
        const point = found.points.get(id)
        if (point !== undefined) point.payload = { ...point.payload, ...payload }
    }
    return ok()
}

const remove = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply => {
    const found = collectionOf(request, context)
    if (!keyed(request, context)) return refusal(403)
    if (found === undefined) return refusal(404)
    const body = request.json()
    for (const id of isJson(body) && Array.isArray(body["points"]) ? body["points"].map(String) : [])
        found.points.delete(id)
    return ok()
}

const query = (request: FakeHttpRequest, context: QdrantFakeContext): FakeHttpReply => {
    const found = collectionOf(request, context)
    if (!keyed(request, context)) return refusal(403)
    if (found === undefined) return refusal(404)
    const body = request.json()
    if (!isJson(body) || !Array.isArray(body["query"])) return refusal(422)
    const vector = body["query"].map(Number)
    const limit = typeof body["limit"] === "number" ? body["limit"] : 10
    const points = [...found.points.entries()]
        .filter(([, point]) => satisfies(point, body["filter"]))
        .map(([id, point]) => ({ id, score: cosine(vector, point.vector) }))
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
    return ok({ points })
}

/**
 * The Qdrant fake: the collection, index, point and query endpoints of the REST API behind the `api-key` header, with cosine
 * scoring and the `must` match filters the index client sends. Steered with `failNext` for an outage (`timeout`) or a refusal.
 */
export const qdrantFake: (options?: undefined) => FakeDefinition<FakeClient> = defineHttpFake<
    FakeClient,
    undefined,
    QdrantFakeState
>({
    state: () => ({ collections: new Map() }),
    routes: [
        { method: "GET", path: "/collections/:collection/exists", handle: exists },
        { method: "GET", path: "/collections/:collection", handle: describe },
        { method: "PUT", path: "/collections/:collection", handle: create },
        { method: "PUT", path: "/collections/:collection/index", handle: index },
        { method: "PUT", path: "/collections/:collection/points", handle: upsert },
        { method: "POST", path: "/collections/:collection/points/payload", handle: setPayload },
        { method: "POST", path: "/collections/:collection/points/delete", handle: remove },
        { method: "POST", path: "/collections/:collection/points/query", handle: query },
    ],
    values: (context) => ({ apiKey: context.secret("qdrant-api-key") }),
})
