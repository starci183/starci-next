import { lookup } from "node:dns/promises"
import http from "node:http"
import https from "node:https"
import { Injectable } from "@nestjs/common"
import type { HttpWire, WireAddress, WireBody, WireCall, WireOptions, WireRequest } from "./http-wire.port"

@Injectable()
/** The http wire over Node's http, https and dns: the only place the app opens a raw socket. */
export class NodeHttpWire implements HttpWire {
    /** Sends the request with the lookup the caller chose and a fresh agent, so no connection is reused. */
    open(url: URL, options: WireOptions, body: WireBody, call: WireCall): WireRequest {
        const transport = url.protocol === "https:" ? https : http
        const outgoing = transport.request(url, { ...options, agent: false }, (response) => {
            call.onResponse({
                status: Number(response.statusCode),
                headers: response.headers,
                onData: (callback) => response.on("data", callback),
                onEnd: (callback) => response.on("end", callback),
                onError: (callback) => response.on("error", callback),
                destroy: () => response.destroy(),
            })
        })
        outgoing.on("error", call.onError)
        outgoing.end(body ?? undefined)
        return { abort: () => outgoing.destroy() }
    }

    /** Resolves the name to every address it has. */
    async resolve(hostname: string): Promise<ReadonlyArray<WireAddress>> {
        return lookup(hostname, { all: true })
    }
}
