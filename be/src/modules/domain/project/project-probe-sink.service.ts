import { randomUUID } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type { FlowSink, OpenedSink, SinkEvent } from "@modules/platform/check-flow"
import { SINK_EVENT_BYTES_MAX, SINK_EVENTS_MAX } from "@modules/platform/check-flow"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"

/** The most sinks open at once; a probe run opens one per flow with a sink step and closes it when the flow ends. */
export const OPEN_SINKS_MAX = 200

/** The headers of a sink event the runner keeps; nothing else of the learner's request is stored. */
const KEPT_HEADERS: ReadonlyArray<string> = ["content-type", "x-starci-probe", "idempotency-key"]

const SINK_ID = /^[0-9a-f-]{36}$/u

@Injectable()
/**
 * The public sink of the server probes: a flow's sink step opens one under an unguessable id, the learner's app POSTs its events to
 * `<PROJECT_PROBE_SINK_URL>/probe-sink/<id>`, and the step reads them. The sinks live in memory (core runs one replica while the relay
 * hub does too), each holds at most a few small events, and an unknown or closed id is refused, so the door stores nothing for anyone
 * else.
 */
export class ProjectProbeSinkService implements FlowSink {
    private readonly sinks = new Map<string, Array<SinkEvent>>()

    constructor(@InjectProjectOptions() private readonly options: ProjectOptions) {}

    /** Whether the server can offer a sink: the public base address is declared. */
    get available(): boolean {
        return this.options.probeSinkBaseUrl !== undefined
    }

    /** Opens a sink for one flow run. */
    open(): Promise<OpenedSink> {
        if (this.sinks.size >= OPEN_SINKS_MAX) {
            const oldest = this.sinks.keys().next().value
            if (oldest !== undefined) this.sinks.delete(oldest)
        }
        const id = randomUUID()
        this.sinks.set(id, [])
        return Promise.resolve({ id, url: `${this.options.probeSinkBaseUrl ?? ""}/probe-sink/${id}` })
    }

    /** The events a sink received so far. */
    received(id: string): Promise<ReadonlyArray<SinkEvent>> {
        return Promise.resolve([...(this.sinks.get(id) ?? [])])
    }

    /** Closes a sink and forgets its events. */
    close(id: string): Promise<void> {
        this.sinks.delete(id)
        return Promise.resolve()
    }

    /**
     * Keeps one event a learner's app delivered: true when the sink is open and had room, false for an unknown id, a full sink or a
     * body over the cap.
     */
    deliver(id: string, headers: Readonly<Record<string, string>>, body: string): boolean {
        const list = SINK_ID.test(id) ? this.sinks.get(id) : undefined
        if (list === undefined || list.length >= SINK_EVENTS_MAX || Buffer.byteLength(body) > SINK_EVENT_BYTES_MAX)
            return false
        const kept = Object.fromEntries(
            KEPT_HEADERS.flatMap((name) => (headers[name] === undefined ? [] : [[name, headers[name]]])),
        )
        list.push({ headers: kept, body })
        return true
    }
}
