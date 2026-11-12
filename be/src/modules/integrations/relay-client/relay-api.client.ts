import {
    RelayRefusalCode,
    type Fetcher,
    type PairingDevice,
    type PairingStart,
    type Refusal,
    type TokenPoll,
} from "./relay-client.contracts"
import { isRecord, jsonOf } from "./json.mapper"

/** A door's status with its parsed body (null when it is not JSON). */
interface DoorAnswer {
    /** The HTTP status, 0 when no answer came. */
    readonly status: number
    /** The parsed body. */
    readonly body: unknown
}

/** A string field of an answer body, or undefined. */
const field = (body: unknown, name: string): string | undefined => {
    if (!isRecord(body)) return undefined
    const value = body[name]
    return typeof value === "string" ? value : undefined
}

/** Posts a JSON body to a StarCi door and answers the status with the parsed body. The doors refuse a state-changing call that names no origin, so it names StarCi's own. */
const post = async (fetcher: Fetcher, url: string, body: unknown): Promise<DoorAnswer> => {
    const answer = await fetcher(url, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", origin: new URL(url).origin },
        body: JSON.stringify(body),
    })
    const read = jsonOf(answer.text)
    return { status: answer.status, body: read.kind === "read" ? read.value : null }
}

/** The refusal of a door answer: its stable code, RELAY_UNREACHABLE when no answer came. */
export const refusalOf = (status: number, code: string | undefined): Refusal => ({
    kind: "refused",
    code: code ?? (status === 0 ? RelayRefusalCode.Unreachable : RelayRefusalCode.Unavailable),
    status,
})

/** The line the CLI prints for a refusal. */
export const refusalLine = (refusal: Refusal): string =>
    refusal.status === 0 ? "StarCi could not be reached." : `StarCi refused (${refusal.code}).`

/** Starts a pairing for this machine. */
export const startPairing = async (fetcher: Fetcher, baseUrl: string, device: PairingDevice): Promise<PairingStart> => {
    const answer = await post(fetcher, `${baseUrl}/api/relay/devices/start`, device)
    const deviceCode = field(answer.body, "deviceCode")
    const userCode = field(answer.body, "userCode")
    const verifyUrl = field(answer.body, "verifyUrl")
    const expiresAt = field(answer.body, "expiresAt")
    if (answer.status !== 200 || !deviceCode || !userCode || !verifyUrl || !expiresAt)
        return refusalOf(answer.status, field(answer.body, "code"))
    return { kind: "started", pairing: { deviceCode, userCode, verifyUrl, expiresAt } }
}

/** Asks once for the device token of a pairing: answered once the learner confirmed on the web. */
export const pollToken = async (fetcher: Fetcher, baseUrl: string, deviceCode: string): Promise<TokenPoll> => {
    const answer = await post(fetcher, `${baseUrl}/api/relay/devices/token`, { deviceCode })
    const deviceToken = field(answer.body, "deviceToken")
    if (answer.status === 200 && deviceToken) return { kind: "token", deviceToken }
    const refusal = refusalOf(answer.status, field(answer.body, "code"))
    return refusal.code === RelayRefusalCode.Pending ? { kind: "pending" } : refusal
}
