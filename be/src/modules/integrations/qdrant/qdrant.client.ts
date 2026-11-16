import { randomUUID } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type { HttpClient, HttpResponse } from "@modules/platform/http"
import { isRecord } from "@modules/platform/primitives"
import { QdrantError, QdrantErrorCode } from "./errors/qdrant.error"
import type { VectorCondition, VectorIndex, VectorMatch, VectorPoint } from "./qdrant.contracts"
import { InjectQdrantHttp, InjectQdrantOptions } from "./qdrant.decorators"
import type { QdrantOptions } from "./qdrant.options"

/** The methods the REST calls use. */
type Method = "GET" | "POST" | "PUT"

/** Qdrant's answer to creating a collection that exists: another process of the app created it first. */
const CONFLICT = 409
const DISTANCE = "Cosine"
const UPSERT_MAX = 128
const BATCH_MAX = 256
const SEARCH_MAX = 100

/** The start offsets of the batches of `step` items that cover `length` items, in order. */
const startsOf = (length: number, step: number): ReadonlyArray<number> =>
    Array.from({ length: Math.ceil(length / step) }, (_, index) => index * step)

/** A match condition on one payload field: one value, or any of several. */
const matchOf = (condition: VectorCondition): object =>
    condition.any.length === 1
        ? { key: condition.key, match: { value: condition.any[0] } }
        : { key: condition.key, match: { any: [...condition.any] } }

/** The filter of a search: every condition must hold, and a search with none, or a condition with no value, is refused. */
const filterOf = (must: ReadonlyArray<VectorCondition>): object => {
    if (must.length === 0 || must.some((condition) => condition.any.length === 0)) {
        throw new QdrantError({ code: QdrantErrorCode.ScopeMissing })
    }
    return { must: must.map(matchOf) }
}

/** The points a query answer holds (`result.points`, or `result` itself for older shapes). */
const resultsOf = (body: unknown): ReadonlyArray<Record<string, unknown>> => {
    if (!isRecord(body)) return []
    const result = body.result
    const list = Array.isArray(result) ? result : isRecord(result) && Array.isArray(result.points) ? result.points : []
    return list.filter(isRecord)
}

/** The vector size and distance a collection answer holds, or null when it does not name them. */
const shapeOf = (body: unknown): { readonly size: number; readonly distance: string } | null => {
    if (!isRecord(body) || !isRecord(body.result) || !isRecord(body.result.config)) return null
    const params = body.result.config.params
    if (!isRecord(params) || !isRecord(params.vectors)) return null
    const { size, distance } = params.vectors
    return typeof size === "number" && typeof distance === "string" ? { size, distance } : null
}

@Injectable()
/**
 * The one place that speaks Qdrant's REST protocol, over the platform HTTP port (no client library). A search takes a mandatory
 * list of conditions that all must hold; a point carries only the payload keywords the filters read, never text. A failure is a
 * `QdrantError`; the API key is never logged. The same shape as NIVO's client, with a generic payload.
 */
export class QdrantClient implements VectorIndex {
    constructor(
        @InjectQdrantHttp() private readonly http: HttpClient,
        @InjectQdrantOptions() private readonly options: QdrantOptions,
    ) {}

    /** Creates the collection and its payload indexes when missing; a collection of another size or distance is refused. */
    async ensure(): Promise<void> {
        const collection = this.options.collection
        const exists = await this.call("GET", `/collections/${collection}/exists`, undefined, "exists")
        const known = isRecord(exists) && isRecord(exists.result) && exists.result.exists === true
        if (known) await this.agree()
        else await this.create()
        for (const field of this.options.payloadIndexes) {
            await this.call(
                "PUT",
                `/collections/${collection}/index?wait=true`,
                { field_name: field, field_schema: "keyword" },
                "index",
            )
        }
    }

    /** Stores points in place of the points of the same ids, in batches; acknowledged before it returns. */
    async upsert(points: ReadonlyArray<VectorPoint>): Promise<void> {
        for (const from of startsOf(points.length, UPSERT_MAX)) {
            const batch = points
                .slice(from, from + UPSERT_MAX)
                .map((point) => ({ id: point.pointId, vector: [...point.vector], payload: { ...point.payload } }))
            await this.call("PUT", `/collections/${this.options.collection}/points?wait=true`, { points: batch }, "upsert")
        }
    }

    /** Replaces payload fields of the points of these ids; their vectors stay. */
    async setPayload(pointIds: ReadonlyArray<string>, payload: Readonly<Record<string, string>>): Promise<void> {
        for (const from of startsOf(pointIds.length, BATCH_MAX)) {
            await this.call(
                "POST",
                `/collections/${this.options.collection}/points/payload?wait=true`,
                { payload: { ...payload }, points: pointIds.slice(from, from + BATCH_MAX) },
                "payload",
            )
        }
    }

    /** Removes the points of these ids. */
    async remove(pointIds: ReadonlyArray<string>): Promise<void> {
        for (const from of startsOf(pointIds.length, BATCH_MAX)) {
            await this.call(
                "POST",
                `/collections/${this.options.collection}/points/delete?wait=true`,
                { points: pointIds.slice(from, from + BATCH_MAX) },
                "delete",
            )
        }
    }

    /** The points nearest to the vector among those that satisfy every condition, nearest first: ids and scores only. */
    async search(
        must: ReadonlyArray<VectorCondition>,
        vector: ReadonlyArray<number>,
        limit: number,
    ): Promise<ReadonlyArray<VectorMatch>> {
        const body = await this.call(
            "POST",
            `/collections/${this.options.collection}/points/query`,
            {
                query: [...vector],
                filter: filterOf(must),
                limit: Math.max(1, Math.min(Math.trunc(limit), SEARCH_MAX)),
                with_payload: false,
                with_vector: false,
            },
            "query",
        )
        return resultsOf(body).flatMap((row) =>
            typeof row.id === "string" && typeof row.score === "number" ? [{ pointId: row.id, score: row.score }] : [],
        )
    }

    /** Creates the collection; a 409 means another process created it first, so it is checked like one that existed. */
    private async create(): Promise<void> {
        const answer = await this.send("PUT", `/collections/${this.options.collection}`, {
            vectors: { size: this.options.dimensions, distance: DISTANCE },
            on_disk_payload: true,
        })
        if (answer.status === CONFLICT) {
            await this.agree()
            return
        }
        this.accepted(answer.status, "create")
    }

    /** Refuses a collection whose vectors the app's could not be compared with. */
    private async agree(): Promise<void> {
        const collection = this.options.collection
        const shape = shapeOf(await this.call("GET", `/collections/${collection}`, undefined, "describe"))
        if (shape !== null && shape.size === this.options.dimensions && shape.distance === DISTANCE) return
        throw new QdrantError({
            code: QdrantErrorCode.Mismatch,
            params: {
                collection,
                expected: `${String(this.options.dimensions)} ${DISTANCE}`,
                found: shape === null ? "unknown" : `${String(shape.size)} ${shape.distance}`,
            },
        })
    }

    /** One call of the REST API; a network failure is `QDRANT_UNAVAILABLE`, any status outside 2xx `QDRANT_REJECTED`. */
    private async call(method: Method, path: string, body: unknown, call: string): Promise<unknown> {
        const answer = await this.send(method, path, body)
        this.accepted(answer.status, call)
        return answer.body
    }

    private accepted(status: number, call: string): void {
        if (status < 200 || status >= 300) {
            throw new QdrantError({ code: QdrantErrorCode.Rejected, params: { call, status: String(status) } })
        }
    }

    private async send(method: Method, path: string, body: unknown): Promise<HttpResponse> {
        const { apiKey } = this.options
        return this.http
            .request({
                correlationId: randomUUID(),
                method,
                url: `${this.options.url}${path}`,
                ...(body === undefined ? {} : { body }),
                ...(apiKey === null ? {} : { headers: { "api-key": apiKey.reveal() } }),
                timeoutMs: this.options.timeoutMs,
            })
            .catch((cause: unknown) => {
                throw new QdrantError({ code: QdrantErrorCode.Unavailable, cause })
            })
    }
}
