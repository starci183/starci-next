import type { Fetcher, GraphqlAnswer, UploadMutation } from "./relay-client.contracts"
import { isRecord, jsonOf } from "./json.mapper"
import { refusalOf } from "./relay-api.client"

/** The GraphQL input type of each upload mutation. */
const INPUT_TYPES: Readonly<Record<UploadMutation, string>> = {
    relayCheckStarted: "RelayCheckStartedInput",
    relayCheckResult: "RelayCheckResultInput",
    relayLog: "RelayLogInput",
    relayManifestAck: "RelayManifestAckInput",
}

/** The manifest query of a task. */
export const MANIFEST_QUERY =
    "query ($input: RelayManifestInput!) { relayManifest(input: $input) { manifestId payload signature } }"

/** The operation text of an upload mutation. */
export const uploadMutationOf = (mutation: UploadMutation): string =>
    `mutation ($input: ${INPUT_TYPES[mutation]}!) { ${mutation}(input: $input) { eventId accepted } }`

/** The stable code of the first GraphQL error of a body, if any. */
const errorCodeOf = (body: unknown): string | null | undefined => {
    const errors: unknown = isRecord(body) ? body.errors : undefined
    if (!Array.isArray(errors) || errors.length === 0) return null
    const first: unknown = errors[0]
    const extensions = isRecord(first) ? first.extensions : undefined
    return isRecord(extensions) && typeof extensions.code === "string" ? extensions.code : undefined
}

/** Runs one GraphQL operation on the core api with the device token; a refusal answers its stable code. */
export const relayGraphql = async (
    fetcher: Fetcher,
    baseUrl: string,
    deviceToken: string,
    query: string,
    variables: Readonly<Record<string, unknown>>,
): Promise<GraphqlAnswer> => {
    const answer = await fetcher(`${baseUrl}/graphql`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json",
            authorization: `Bearer ${deviceToken}`,
        },
        body: JSON.stringify({ query, variables }),
    })
    const read = jsonOf(answer.text)
    const body = read.kind === "read" ? read.value : null
    const code = errorCodeOf(body)
    if (code !== null || !isRecord(body) || !isRecord(body.data)) return refusalOf(answer.status, code ?? undefined)
    return { kind: "data", data: body.data }
}
