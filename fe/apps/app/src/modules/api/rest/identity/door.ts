import axios from "axios"
import type { GraphQLResponse } from "../../graphql"
import { attachLocaleLink } from "../links/locale"

/** The REST client of the identity doors: same-origin, bounded by the session contract's outbound budget; every status is read, none throws. */
const client = axios.create({
    timeout: 10_000,
    validateStatus: () => true,
})
attachLocaleLink(client)

/** The code of a transport failure (network, timeout) and of an answer the door's contract does not describe. */
const TRANSPORT_FAILED = "TRANSPORT_FAILED"

/** The failure for a call that never got a readable answer. */
const transportFailure = (): GraphQLResponse<never> => ({
    success: false,
    error: TRANSPORT_FAILED,
    kind: "unavailable",
    message: "",
})

/** The error body `{ code, kind, message, params }` the back end answers every refusal with. */
interface ErrorBody {
    readonly code: string
    readonly kind: string
    readonly message?: unknown
    readonly params?: unknown
}

/** Narrows an error body before it is read; the wire shape is checked, never trusted. */
const isErrorBody = (value: unknown): value is ErrorBody =>
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "kind" in value &&
    typeof value.code === "string" &&
    typeof value.kind === "string"

/** The params of an error body when they are a plain object. */
const paramsOf = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
    typeof value === "object" && value !== null && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value))
        : undefined

/**
 * Posts a JSON body (or none) to an identity door and folds the answer into the one outcome of modules/api: a 2xx answer
 * is a success whose data `read` narrows from the body, anything else is a failure carrying the stable error code of the
 * body, never the HTTP status.
 */
export const postDoor = async <TData>(
    path: string,
    body: Readonly<Record<string, unknown>> | undefined,
    read: (data: unknown) => TData | undefined,
): Promise<GraphQLResponse<TData>> => {
    try {
        const response = await client.post<unknown>(path, body)
        if (response.status >= 200 && response.status < 300) {
            const data = read(response.data)
            return data === undefined ? transportFailure() : { success: true, data }
        }
        if (!isErrorBody(response.data)) return transportFailure()
        const { code, kind, message, params } = response.data
        return {
            success: false,
            error: code,
            kind,
            message: typeof message === "string" ? message : "",
            params: paramsOf(params),
        }
    } catch {
        return transportFailure()
    }
}

/** The reader of a door that answers `204`: success carries no data. */
export const readNothing = (): null => null
