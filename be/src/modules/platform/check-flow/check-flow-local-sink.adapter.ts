import { randomUUID } from "node:crypto"
import { createServer, type IncomingMessage, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import type { FlowSink, OpenedSink, SinkEvent } from "./check-flow.port"

/** The most events one sink keeps, and the bytes of one event. */
export const SINK_EVENTS_MAX = 50
export const SINK_EVENT_BYTES_MAX = 65_536

const headersOf = (request: IncomingMessage): Record<string, string> =>
    Object.fromEntries(
        Object.entries(request.headers).flatMap(([name, value]) =>
            typeof value === "string" ? [[name, value]] : Array.isArray(value) ? [[name, value.join(", ")]] : [],
        ),
    )

/**
 * A sink on the learner's own machine: a listener on 127.0.0.1 that keeps what the learner's app POSTs to
 * `http://127.0.0.1:<port>/sink/<id>`. The CLI opens it for the e2e flow of an outbox concept; the server has its own public sink.
 */
export class LocalFlowSink implements FlowSink {
    private readonly events = new Map<string, Array<SinkEvent>>()
    private server: Server | null = null
    private port = 0

    /** Opens a sink, starting the listener on first use. */
    async open(): Promise<OpenedSink> {
        await this.listen()
        const id = randomUUID()
        this.events.set(id, [])
        return { id, url: `http://127.0.0.1:${this.port}/sink/${id}` }
    }

    /** The events received so far. */
    received(id: string): Promise<ReadonlyArray<SinkEvent>> {
        return Promise.resolve([...(this.events.get(id) ?? [])])
    }

    /** Forgets the sink, and stops the listener when no sink is open. */
    async close(id: string): Promise<void> {
        this.events.delete(id)
        if (this.events.size === 0) await this.stop()
    }

    /** Stops the listener. */
    stop(): Promise<void> {
        const server = this.server
        this.server = null
        return server === null
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                  server.close(() => resolve())
              })
    }

    private listen(): Promise<void> {
        if (this.server !== null) return Promise.resolve()
        const server = createServer((request, response) => {
            const id = /^\/sink\/([\w-]+)$/u.exec(request.url ?? "")?.[1]
            const list = id === undefined ? undefined : this.events.get(id)
            if (request.method !== "POST" || list === undefined) {
                response.writeHead(404).end()
                return
            }
            const chunks: Array<Buffer> = []
            let size = 0
            request.on("data", (chunk: Buffer) => {
                size += chunk.length
                if (size <= SINK_EVENT_BYTES_MAX) chunks.push(chunk)
            })
            request.on("end", () => {
                if (size <= SINK_EVENT_BYTES_MAX && list.length < SINK_EVENTS_MAX) {
                    list.push({ headers: headersOf(request), body: Buffer.concat(chunks).toString("utf8") })
                }
                response.writeHead(202).end()
            })
        })
        this.server = server
        return new Promise<void>((resolve) => {
            server.listen(0, "127.0.0.1", () => {
                this.port = (server.address() as AddressInfo).port
                resolve()
            })
        })
    }
}
