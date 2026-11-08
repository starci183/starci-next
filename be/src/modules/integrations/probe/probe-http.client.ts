import type { LookupFunction } from "node:net"
import { Injectable } from "@nestjs/common"
import { InjectTimer, type Timer } from "@modules/platform/retry"
import { ProbeError, ProbeErrorCode } from "./errors/probe.error"
import type { ProbeReply, ProbeSendRequest } from "./probe.contracts"
import type { ProbeTransport } from "./probe.port"
import { isPublicAddress } from "./probe-address.policy"
import { InjectHttpWire, type HttpWire, type WireResponse } from "@modules/platform/http"

/** A cancel that does nothing, until the timer gives the real one. */
const noop = (): void => undefined

const flatHeadersOf = (headers: WireResponse["headers"]): Readonly<Record<string, string>> =>
    Object.fromEntries(
        Object.entries(headers).flatMap(([name, value]) => {
            if (typeof value === "string") return [[name, value]]
            return Array.isArray(value) ? [[name, value.join(", ")]] : []
        }),
    )

@Injectable()
/**
 * The HTTP client of the probes: public http and https only (the address of every connection is checked), no redirect is followed,
 * no cookie is kept, the whole request has a deadline and the response is read only up to a byte cap. It never throws: a request that
 * got no response answers the reason (`timeout`, `too-large`, `target-refused`, `network`).
 */
export class ProbeHttpClient implements ProbeTransport {
    constructor(
        @InjectTimer() private readonly timer: Timer,
        @InjectHttpWire() private readonly wire: HttpWire,
    ) {}

    /** Sends one probe request and answers the response, or why there is none. */
    send(request: ProbeSendRequest): Promise<ProbeReply> {
        return new Promise<ProbeReply>((resolve) => {
            let settled = false
            let cancel: () => void = noop
            const finish = (reply: ProbeReply): void => {
                if (settled) return
                settled = true
                cancel()
                resolve(reply)
            }
            const readBody = (response: WireResponse): void => {
                const chunks: Array<Buffer> = []
                let size = 0
                response.onData((chunk) => {
                    size += chunk.length
                    if (size > request.maxBytes) {
                        finish({ ok: false, error: "too-large" })
                        response.destroy()
                    } else {
                        chunks.push(chunk)
                    }
                })
                response.onEnd(() =>
                    finish({
                        ok: true,
                        status: response.status,
                        headers: flatHeadersOf(response.headers),
                        body: Buffer.concat(chunks).toString("utf8"),
                    }),
                )
                response.onError(() => finish({ ok: false, error: "network" }))
            }
            const outgoing = this.wire.open(
                new URL(request.url),
                {
                    method: request.method,
                    headers: {
                        ...request.headers,
                        "user-agent": "StarCi-Probe/1",
                        ...(request.body === null ? {} : { "content-length": String(Buffer.byteLength(request.body)) }),
                    },
                    lookup: this.guardedLookup(),
                },
                request.body,
                {
                    onResponse: readBody,
                    onError: (failure) =>
                        finish({ ok: false, error: failure instanceof ProbeError ? "target-refused" : "network" }),
                },
            )
            cancel = this.timer.schedule(() => {
                finish({ ok: false, error: "timeout" })
                outgoing.abort()
            }, request.timeoutMs)
        })
    }

    /** True when the name resolves to public addresses only: the check a deployed address gets when it is saved. */
    isPublicHost(hostname: string): Promise<boolean> {
        return this.wire.resolve(hostname).then(
            (addresses) => addresses.length > 0 && addresses.every((entry) => isPublicAddress(entry.address)),
            () => false,
        )
    }

    /**
     * The lookup every probe connection uses: the name is resolved here, every address it resolves to must be public, and the socket
     * connects to one of those addresses. A name that points to a private, loopback or link-local address is refused, and a name that
     * changes its answer between a check and a connection cannot slip through, because the check is the connection.
     */
    private guardedLookup(): LookupFunction {
        return (hostname, options, callback) => {
            this.wire.resolve(hostname).then(
                (addresses) => {
                    const first = addresses[0]
                    if (first === undefined || addresses.some((entry) => !isPublicAddress(entry.address))) {
                        callback(new ProbeError({ code: ProbeErrorCode.TargetRefused }), "", 0)
                    } else if (options.all === true) {
                        callback(null, [...addresses])
                    } else {
                        callback(null, first.address, first.family)
                    }
                },
                (error: NodeJS.ErrnoException) => callback(error, "", 0),
            )
        }
    }
}
