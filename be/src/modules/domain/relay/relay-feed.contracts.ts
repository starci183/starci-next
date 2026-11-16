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
    /** For a lesson task: the one scenario asked, or undefined. */
    readonly scenario?: string | undefined
    /** For a lesson task: the challenge tier whose hidden scenarios are asked, or undefined. */
    readonly challenge?: string | undefined
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

/** A guard of a lesson scenario: the name the learner turns off, the environment variable and its off value. */
export interface ManifestLessonGuard {
    /** The guard name. */
    readonly name: string
    /** The environment variable the command reads. */
    readonly env: string
    /** The value that turns it off. */
    readonly off: string
}

/** A hidden test source of a challenge scenario, written for one run only. */
export interface ManifestHiddenFile {
    /** The path under the repository, relative. */
    readonly path: string
    /** The content, base64. */
    readonly contentBase64: string
}

/** One allowlisted lesson scenario (SCENARIO-CONTRACT v2 §2). */
export interface ManifestLessonScenario {
    /** The scenario id. */
    readonly id: string
    /** The title. */
    readonly title: string
    /** What it does, with no solution. */
    readonly brief: string
    /** The concepts it proves. */
    readonly concepts: ReadonlyArray<string>
    /** The only command the CLI may run for it. */
    readonly command: string
    /** Where it runs, relative to the repository. */
    readonly cwd: string
    /** The JUnit report it writes, relative to the repository. */
    readonly report: string
    /** When it is stopped, in milliseconds. */
    readonly timeoutMs: number
    /** The guards the learner may turn off. */
    readonly guards: ReadonlyArray<ManifestLessonGuard>
    /** The hidden test sources of a challenge scenario; absent for a plain scenario. */
    readonly files?: ReadonlyArray<ManifestHiddenFile>
}

/** The lesson section of a manifest: the pinned repository and what may run (SCENARIO-CONTRACT v2 §2). */
export interface ManifestLesson {
    /** The lesson slug. */
    readonly lessonId: string
    /**
     * The lesson's `source/` folder as a tarball at the pinned content commit (SCENARIO-CONTRACT v3 §4): `url` is the path on
     * the StarCi origin the CLI fetches with its device token, `sha256` the hash of the tarball bytes, `commit` the content
     * commit (40 lowercase hex) it was cut at.
     */
    readonly source: { readonly url: string; readonly sha256: string; readonly commit: string }
    /** The TypeScript project folder. */
    readonly dir: string
    /** The folder holding docker-compose.yml. */
    readonly compose: string
    /** The compose project name. */
    readonly project: string
    /** The invariant names by id. */
    readonly invariants: Readonly<Record<string, string>>
    /** The scenarios, in teaching order. */
    readonly scenarios: ReadonlyArray<ManifestLessonScenario>
    /** The hidden scenarios of the asked tier, only when it is unlocked. */
    readonly challenge?: { readonly tier: string; readonly scenarios: ReadonlyArray<ManifestLessonScenario> }
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
    /** The lesson section of a `lesson:<id>` task, absent otherwise. */
    readonly lesson?: ManifestLesson
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
    /** For a lesson scenario result: the lesson slug. */
    readonly lessonId?: string | undefined
    /** For a lesson scenario result: the scenario id (the check id). */
    readonly scenarioId?: string | undefined
    /** For a lesson scenario result: the concepts that had a running test. */
    readonly concepts?: ReadonlyArray<string> | undefined
    /** For a lesson scenario result: the guards turned off for the run. */
    readonly guardsOff?: ReadonlyArray<string> | undefined
    /** For a challenge run: the tier. */
    readonly challengeTier?: string | undefined
    /** The first `[invariant:<id>] <hint>` failure message, 300 characters at most. */
    readonly why?: string | undefined
    /** The ledger lines of the run, 4000 characters at most. */
    readonly ledger?: string | undefined
}

/** What an upload answers: the event id and that it is stored (also when it was a resend). */
export interface UploadReceipt {
    /** The client event id. */
    readonly eventId: string
    /** Always true once stored; a resend answers true too. */
    readonly accepted: boolean
}
