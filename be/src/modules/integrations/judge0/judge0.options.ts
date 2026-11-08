import type { Secret } from "@modules/platform/config"

/** The declared Judge0 endpoint this instance runs code through. */
export interface Judge0Options {
    /** The origin of the self-hosted Judge0, without a trailing slash. */
    readonly baseUrl: string
    /** The token sent as `X-Auth-Token`; read from custody by name, never logged. */
    readonly authToken: Secret
    /** How long one HTTP call to Judge0 may take. */
    readonly timeoutMs: number
    /** How long the client waits between two reads of a batch that is still judging. */
    readonly pollIntervalMs: number
    /** How long a whole batch may take, polls included. */
    readonly deadlineMs: number
}

/** What the app root hands the Judge0 capability. */
export interface Judge0ModuleOptions {
    /** Whether this capability is available app-wide; only an app composition root may pass `true`. */
    readonly isGlobal?: boolean
    /** The declared endpoint; `null` still composes the gateway so every run refuses with JUDGE0_NOT_CONFIGURED. */
    readonly judge0: Judge0Options | null
}
