/** One allowlisted check of a task manifest: what the CLI runs, where, and for how long at most. */
export interface ManifestCheck {
    /** The check id the results name. */
    readonly id: string
    /** The exact command; the CLI shows it and asks before running it. */
    readonly command: string
    /** The folder it runs in, relative to the task workspace. */
    readonly cwd: string
    /** The longest it may run, in milliseconds; it is stopped and reported timed out after. */
    readonly timeoutMs: number
}

/** The manifest body StarCi signs: the task, who may run it, when it was issued and its allowlisted checks. */
export interface ManifestBody {
    /** The manifest id the ack names. */
    readonly manifestId: string
    /** The task (a project id). */
    readonly taskId: string
    /** The learner and the device it was issued to. */
    readonly learnerId: string
    /** The device it was issued to. */
    readonly deviceId: string
    /** The UTC instant it was issued. */
    readonly issuedAt: string
    /** The allowlisted checks. */
    readonly checks: ReadonlyArray<ManifestCheck>
}

/** A signed manifest: the body, its canonical text and the base64 Ed25519 signature of that text. */
export interface SignedManifest {
    /** The body, for reading. */
    readonly body: ManifestBody
    /** The exact text that was signed (canonical JSON of the body). */
    readonly payload: string
    /** The base64 Ed25519 signature of the payload. */
    readonly signature: string
}

/** The frames the relay pushes to one device; the socket is push-only (R185), every write is an upload mutation. */
export type RelayFrame =
    | { readonly id: string; readonly type: "manifest"; readonly manifest: SignedManifest }
    | { readonly id: string; readonly type: "ack"; readonly eventId: string }
    | { readonly id: string; readonly type: "coach.message"; readonly text: string }

/** The kinds of event a device uploads. */
export type RelayUploadKind = "check.started" | "check.result" | "log" | "manifest.ack"

/** One upload of a device: the client event id it is idempotent on, its kind and the facts of that kind. */
export interface RelayUpload {
    /** The client event id (uuid); a resend of the same id stores nothing twice. */
    readonly eventId: string
    /** What happened. */
    readonly kind: RelayUploadKind
    /** The task the manifest named. */
    readonly taskId: string
    /** The run of the manifest's checks. */
    readonly runId: string
    /** The check, for a started, result or log event. */
    readonly checkId?: string | undefined
    /** The concept the check proves in practice, for a result. */
    readonly conceptId?: string | undefined
    /** test, e2e or probe, for a result. */
    readonly slot?: string | undefined
    /** The test name, e2e file or probe id, for a result. */
    readonly ref?: string | undefined
    /** Whether it passed, for a result. */
    readonly passed?: boolean | undefined
    /** The exit code, for a result. */
    readonly exitCode?: number | undefined
    /** How long it ran in milliseconds, for a result. */
    readonly durationMs?: number | undefined
    /** The commit it ran on, for a result. */
    readonly commit?: string | undefined
    /** The log text, for a log event (16 KiB at most). */
    readonly text?: string | undefined
    /** The manifest id, for a manifest ack. */
    readonly manifestId?: string | undefined
}

/** What an upload answers: the event id and that it is stored (also when it was a resend). */
export interface UploadReceipt {
    /** The client event id. */
    readonly eventId: string
    /** Always true once stored; a resend answers true too. */
    readonly accepted: boolean
}
