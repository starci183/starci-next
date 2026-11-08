/** One request the probe transport sends, with the caps put on it. */
export interface ProbeSendRequest {
    /** The HTTP method. */
    readonly method: string
    /** The absolute http or https address. */
    readonly url: string
    /** The headers to send. */
    readonly headers: Readonly<Record<string, string>>
    /** The body to send, or null. */
    readonly body: string | null
    /** The milliseconds the whole request may take, connection and body included. */
    readonly timeoutMs: number
    /** The bytes of the response body read before the request gives up. */
    readonly maxBytes: number
}

/** What a probe request got: a response, or the reason none came (`timeout`, `too-large`, `target-refused`, `network`). */
export type ProbeReply =
    | {
          readonly ok: true
          readonly status: number
          readonly headers: Readonly<Record<string, string>>
          readonly body: string
      }
    | { readonly ok: false; readonly error: string }
