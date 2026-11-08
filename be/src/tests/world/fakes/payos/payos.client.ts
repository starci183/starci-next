import { createHmac } from "node:crypto"
import {
    defineHttpFake,
    type FakeClient,
    type FakeDefinition,
    type FakeHttpReply,
    type FakeHttpRequest,
    type HttpFakeContext,
} from "@starci/test-world/fakes"

/** The client id the payOS fake expects as `x-client-id`; the app under test registers the same one. */
export const PAYOS_FAKE_CLIENT_ID = "starci-next-integration-payos"

/** The payment requests the fake created, by order code. */
interface PayosFakeState {
    readonly requests: Map<number, Record<string, unknown>>
}

type PayosFakeContext = HttpFakeContext<PayosFakeState, undefined>

type Json = Record<string, unknown>

const isJson = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value)

/** The signature payOS computes over a `data` object: keys sorted, `key=value` joined by `&`, lower-case hex HMAC-SHA256. */
const signed = (data: Json, checksumKey: string): string =>
    createHmac("sha256", checksumKey)
        .update(
            Object.keys(data)
                .sort((left, right) => left.localeCompare(right))
                .map((key) => `${key}=${String(data[key])}`)
                .join("&"),
            "utf8",
        )
        .digest("hex")

const answerOf = (data: Json, checksumKey: string): FakeHttpReply => ({
    body: { code: "00", desc: "success", data, signature: signed(data, checksumKey) },
})

const refusal = (code: string, desc: string): FakeHttpReply => ({ body: { code, desc } })

const authorized = (request: FakeHttpRequest, context: PayosFakeContext): boolean =>
    request.headers["x-client-id"] === PAYOS_FAKE_CLIENT_ID &&
    request.headers["x-api-key"] === context.secret("payos-api-key")

const linkOf = (data: Json, context: PayosFakeContext): Json => ({
    paymentLinkId: `pl-${String(data.orderCode)}`,
    checkoutUrl: `https://pay.payos.test/web/pl-${String(data.orderCode)}`,
    orderCode: data.orderCode,
    amount: data.amount,
    status: "PENDING",
    bin: context.host,
})

const create = (request: FakeHttpRequest, context: PayosFakeContext): FakeHttpReply => {
    if (!authorized(request, context)) return refusal("401", "unauthorized")
    const body = request.json()
    if (!isJson(body) || typeof body.orderCode !== "number") return refusal("20", "invalid request")
    if (context.state.requests.has(body.orderCode)) return refusal("231", "order code already exists")
    const link = linkOf(body, context)
    context.state.requests.set(body.orderCode, link)
    return answerOf(link, context.secret("payos-checksum-key"))
}

const read = (request: FakeHttpRequest, context: PayosFakeContext): FakeHttpReply => {
    if (!authorized(request, context)) return refusal("401", "unauthorized")
    const link = context.state.requests.get(Number(request.params.orderCode))
    if (link === undefined) return refusal("101", "payment request not found")
    const { paymentLinkId, orderCode, amount, status } = link
    return answerOf({ id: paymentLinkId, orderCode, amount, status }, context.secret("payos-checksum-key"))
}

/** The payOS fake: the merchant API's create and read endpoints, answering signed payment links, steered through `failNext`. */
export const payosFake: (options?: undefined) => FakeDefinition<FakeClient> = defineHttpFake<
    FakeClient,
    undefined,
    PayosFakeState
>({
    state: () => ({ requests: new Map() }),
    routes: [
        { method: "POST", path: "/v2/payment-requests", handle: create },
        { method: "GET", path: "/v2/payment-requests/:orderCode", handle: read },
    ],
    values: (context) => ({
        clientId: PAYOS_FAKE_CLIENT_ID,
        apiKey: context.secret("payos-api-key"),
        checksumKey: context.secret("payos-checksum-key"),
    }),
})
