/** One request a flow sends, resolved. */
export interface FlowWireRequest {
    /** The method. */
    readonly method: string
    /** The absolute address. */
    readonly url: string
    /** The headers. */
    readonly headers: Readonly<Record<string, string>>
    /** The body, or null. */
    readonly body: string | null
}

/** What a request got: a response, or the reason none came (`timeout`, `too-large`, `target-refused`, `network`). */
export type FlowWireReply =
    | {
          readonly ok: true
          readonly status: number
          readonly headers: Readonly<Record<string, string>>
          readonly body: string
      }
    | { readonly ok: false; readonly error: string }

/** Sends the requests of a flow. The server binds its guarded probe client; the CLI binds a client held to the project's base. */
export interface FlowTransport {
    /** Sends one request; it never throws. */
    send(request: FlowWireRequest): Promise<FlowWireReply>
}

/** One event the learner's app delivered to a sink. */
export interface SinkEvent {
    /** The headers, names lower-cased. */
    readonly headers: Readonly<Record<string, string>>
    /** The body as text. */
    readonly body: string
}

/** A sink a flow opened: the address the learner's app delivers to, and its id. */
export interface OpenedSink {
    /** The sink id. */
    readonly id: string
    /** The public address of the sink. */
    readonly url: string
}

/** Where a flow's sink step receives the events the learner's app sends (the outbox concept). */
export interface FlowSink {
    /** Opens a sink for one run. */
    open(): Promise<OpenedSink>
    /** The events the sink received so far. */
    received(id: string): Promise<ReadonlyArray<SinkEvent>>
    /** Closes the sink and forgets its events. */
    close(id: string): Promise<void>
}

/** The clock of a run: elapsed milliseconds and a wait. */
export interface FlowClock {
    /** Milliseconds since an arbitrary origin. */
    now(): number
    /** Resolves after the milliseconds. */
    sleep(ms: number): Promise<void>
}

/** What a flow run is given to talk to the world. */
export interface FlowPorts {
    /** The HTTP transport. */
    readonly transport: FlowTransport
    /** The sink, or null where none is available (a flow with a sink step is then skipped). */
    readonly sink: FlowSink | null
    /** The clock. */
    readonly clock: FlowClock
}
