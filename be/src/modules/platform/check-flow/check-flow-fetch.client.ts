import type { FlowClock, FlowTransport, FlowWireReply, FlowWireRequest } from "./check-flow.port"

/** The caps of the local transport. */
export interface LocalTransportCaps {
    /** The milliseconds one request may take. */
    readonly timeoutMs: number
    /** The bytes of a body read before the request gives up. */
    readonly maxBytes: number
}

const headersOf = (headers: Headers): Record<string, string> => {
    const flat: Record<string, string> = {}
    headers.forEach((value, name) => {
        flat[name.toLowerCase()] = value
    })
    return flat
}

/**
 * The transport of a flow the learner's own machine runs (the CLI's e2e flows, CI): plain fetch with a deadline, a byte cap and no
 * redirect. The runner already holds every request to the project's base address; the server never uses this transport, it binds
 * the guarded probe client that reaches public addresses only.
 */
export class FetchFlowTransport implements FlowTransport {
    constructor(private readonly caps: LocalTransportCaps) {}

    /** Sends one request; it never throws. */
    async send(request: FlowWireRequest): Promise<FlowWireReply> {
        try {
            const response = await fetch(request.url, {
                method: request.method,
                headers: request.headers,
                body: request.body,
                redirect: "manual",
                signal: AbortSignal.timeout(this.caps.timeoutMs),
            })
            const bytes = Buffer.from(await response.arrayBuffer())
            if (bytes.length > this.caps.maxBytes) return { ok: false, error: "too-large" }
            return {
                ok: true,
                status: response.status,
                headers: headersOf(response.headers),
                body: bytes.toString("utf8"),
            }
        } catch (cause) {
            return { ok: false, error: cause instanceof Error && cause.name === "TimeoutError" ? "timeout" : "network" }
        }
    }
}

/** The clock of a flow run on a real machine. */
export const systemFlowClock: FlowClock = {
    now: () => performance.now(),
    sleep: (ms) =>
        new Promise<void>((resolve) => {
            setTimeout(resolve, ms)
        }),
}
