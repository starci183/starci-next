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

/** What a project run adds to a manifest: the milestone it is for, the JUnit report it reads and the concepts that count. */
export interface ManifestPlan {
    /** The milestone the learner runs. */
    readonly milestone: string
    /** The JUnit XML report, relative to the project folder, that the test command writes. */
    readonly report: string
    /** The concepts of the milestone: only tests tagged with one of them count. */
    readonly concepts: ReadonlyArray<string>
}

/** A milestone of the catalog with the concepts it lists. */
export interface ManifestMilestone {
    /** The milestone id. */
    readonly id: string
    /** The concept ids it lists. */
    readonly concepts: ReadonlyArray<string>
}

/** What the device asks a manifest for: the milestone of a project run (absent for a plain task) and the `starci/project.yaml` values. */
export interface ManifestRequest {
    /** The milestone id of a project run, or undefined for a plain task. */
    readonly milestone?: string | undefined
    /** The test command of `starci/project.yaml`, or undefined for the default `npm test`. */
    readonly testCommand?: string | undefined
    /** The JUnit report path of `starci/project.yaml`, or undefined for the default. */
    readonly testReport?: string | undefined
}

/** A project run resolved against the catalog: the milestone with its concepts, and the test command and report. */
export interface ProjectRunRequest {
    /** The milestone and its concepts, from the catalog. */
    readonly milestone: ManifestMilestone
    /** The test command of `starci/project.yaml`, or undefined for the default `npm test`. */
    readonly testCommand?: string | undefined
    /** The JUnit report path of `starci/project.yaml`, or undefined for the default. */
    readonly testReport?: string | undefined
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
    /** The milestone, report and concepts of a project run, absent for a plain task. */
    readonly plan?: ManifestPlan
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
