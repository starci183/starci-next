/** The boot stages of a lab on the learner machine, in the order the CLI reports them. */
export const LAB_BOOT_STAGES = ["machine", "clone", "compose", "seed", "first-run"] as const

/** One boot stage name. */
export type LabBootStage = (typeof LAB_BOOT_STAGES)[number]

/** Where a boot stage stands. */
export type LabBootStatus = "running" | "done" | "failed"

/** What the lab on the machine was asked to do: boot it, run the tests, switch chaos, or grade a submission. */
export type LabAction = "boot" | "test" | "chaos" | "grade"

/** One chaos switch of a lab as the machine receives it: the environment variable set to the value while the switch is on. */
export interface ManifestLabChaos {
    /** The switch id. */
    readonly id: string
    /** The environment variable of the compose project. */
    readonly env: string
    /** The value it takes while the switch is on. */
    readonly value: string
}

/** One hidden grading file sent to the machine for one grading run only: the path, its hash and the base64 content. */
export interface ManifestLabGradeFile {
    /** The path under the repository, relative. */
    readonly path: string
    /** The SHA-256 (hex) of the content bytes. */
    readonly sha256: string
    /** The content, base64. */
    readonly content: string
}

/** The grading section of a `grade` manifest: what the machine runs on a clean checkout and signs. */
export interface ManifestLabGrade {
    /** The submission the result is uploaded for. */
    readonly submissionId: string
    /** The nonce the signed result must carry (64 hex). */
    readonly nonce: string
    /** The hidden test ids in the random order the run executes them. */
    readonly seedOrder: ReadonlyArray<string>
    /** The commit the relay last saw synced for the learner (the machine grades its own committed HEAD), or null. */
    readonly commit: string | null
    /** The hidden files, written for this run only and deleted after it. */
    readonly files: ReadonlyArray<ManifestLabGradeFile>
}

/** The lab section of a manifest (task `course:<courseId>/<lessonId>`): the repository, the compose project and what may run. */
export interface ManifestLab {
    /** The course. */
    readonly courseId: string
    /** The lesson. */
    readonly lessonId: string
    /** The lab repository, branch and the pinned commit (null: the branch head). */
    readonly repo: { readonly url: string; readonly branch: string; readonly commit: string | null }
    /** The folder holding the compose file, relative to the repository. */
    readonly compose: string
    /** The compose project name, `starci-<course>-<lesson>`. */
    readonly project: string
    /** The compose services whose logs are streamed. */
    readonly services: ReadonlyArray<string>
    /** The seed command. */
    readonly seed: { readonly command: string; readonly timeoutMs: number }
    /** The test command and the JUnit report it writes. */
    readonly test: { readonly command: string; readonly report: string; readonly timeoutMs: number }
    /** The files the learner edits and the relay mirrors back to the web. */
    readonly files: ReadonlyArray<string>
    /** Every chaos switch of the lab. */
    readonly chaos: ReadonlyArray<ManifestLabChaos>
    /** The chaos switches that are on for this run. */
    readonly chaosOn: ReadonlyArray<string>
    /** What the machine does. */
    readonly action: LabAction
    /** The grading section, only for the `grade` action. */
    readonly grade?: ManifestLabGrade
}

/** One visible test of a lab: what the web lists before any run. */
export interface RelayLabTest {
    /** The test id. */
    readonly id: string
    /** The test name. */
    readonly name: string
    /** The file the test lives in. */
    readonly file: string
}

/** One chaos switch of the lab contract: the machine part and the label the learner reads. */
export interface RelayLabChaos extends ManifestLabChaos {
    /** The switch label the web shows. */
    readonly label: string
}

/** The lab contract of one lesson, as the course capability holds it; the relay adds the action and the grading section. */
export interface RelayLabContract {
    /** The lab repository, branch and the pinned commit. */
    readonly repo: ManifestLab["repo"]
    /** The folder holding the compose file. */
    readonly compose: string
    /** The compose services whose logs are streamed. */
    readonly services: ReadonlyArray<string>
    /** The seed command. */
    readonly seed: ManifestLab["seed"]
    /** The test command. */
    readonly test: ManifestLab["test"]
    /** The files the learner edits. */
    readonly files: ReadonlyArray<string>
    /** Every chaos switch with its label. */
    readonly chaos: ReadonlyArray<RelayLabChaos>
    /** The visible tests. */
    readonly tests: ReadonlyArray<RelayLabTest>
}

/** One hidden grading file as the course capability holds it: the path, the SHA-256 (hex) and the text. */
export interface RelayLabHiddenFile {
    /** The path under the repository, relative. */
    readonly path: string
    /** The SHA-256 (hex) of the text bytes. */
    readonly sha256: string
    /** The file text. */
    readonly text: string
}

/** What `lab.boot` reports: one boot stage. */
export interface RelayLabBootFacts {
    /** The stage. */
    readonly stage: LabBootStage
    /** Where it stands. */
    readonly status: LabBootStatus
    /** A short line about it, 300 characters at most. */
    readonly detail: string
    /** How long the stage ran, in milliseconds. */
    readonly durationMs: number
}

/** One test result of a visible test run. */
export interface RelayLabTestFact {
    /** The test id. */
    readonly id: string
    /** The test name. */
    readonly name: string
    /** Whether it passed. */
    readonly passed: boolean
    /** How long it ran, in milliseconds. */
    readonly durationMs: number
    /** The failure message, 1000 characters at most; empty when it passed. */
    readonly message: string
}

/** What `lab.tests` reports: one run of the visible tests. */
export interface RelayLabTestsFacts {
    /** The commit the run was on (40 hex). */
    readonly commit: string
    /** The chaos switches that were on. */
    readonly chaosOn: ReadonlyArray<string>
    /** The results. */
    readonly tests: ReadonlyArray<RelayLabTestFact>
}

/** One mirrored file: the text, or null when it is larger than the cap. */
export interface RelayLabFileFact {
    /** The path, one of the manifest's `files`. */
    readonly path: string
    /** The SHA-256 (hex) of the file bytes. */
    readonly sha256: string
    /** The text (64 KiB at most), or null when the file is larger. */
    readonly text: string | null
}

/** What `lab.files` reports: the learner's files at a commit. */
export interface RelayLabFilesFacts {
    /** The commit they were read at (40 hex). */
    readonly commit: string
    /** The files. */
    readonly files: ReadonlyArray<RelayLabFileFact>
}

/** One hidden test result of a grading run. */
export interface RelayLabGradeTest {
    /** The hidden test id. */
    readonly id: string
    /** Whether it passed. */
    readonly passed: boolean
    /** How long it ran, in milliseconds. */
    readonly durationMs: number
    /** The failure message, 1000 characters at most; empty when it passed. */
    readonly message: string
}

/** What `lab.grade` uploads: the signed result of a grading run on the learner's clean checkout. */
export interface RelayLabGradeFacts {
    /** The submission. */
    readonly submissionId: string
    /** The nonce of the grade manifest. */
    readonly nonce: string
    /** The learner's committed sha the run was on (40 hex). */
    readonly commit: string
    /** The results, one per hidden test id. */
    readonly tests: ReadonlyArray<RelayLabGradeTest>
    /** The base64 Ed25519 signature of the canonical JSON of `{submissionId, nonce, commit, tests}`. */
    readonly signature: string
}

/** Why a grade upload was rejected: a stable code. */
export type LabGradeRejection =
    | "device-key-missing"
    | "signature-invalid"
    | "nonce-mismatch"
    | "commit-invalid"
    | "tests-mismatch"
    | "not-running"
    | "timed-out"
    | "superseded"
    | "push-failed"

/** The states of a submission. */
export type LabSubmissionStatus = "queued" | "running" | "graded" | "rejected"

/** One boot stage as the web reads it. */
export interface CourseLabBootView extends RelayLabBootFacts {
    /** When the stage was reported, ISO 8601. */
    readonly at: string
}

/** One visible test as the web reads it: the contract's test with the last run's result (null before any run). */
export interface CourseLabTestView extends RelayLabTest {
    /** Whether it passed in the last run, or null when none ran. */
    readonly passed: boolean | null
    /** How long it ran, or null. */
    readonly durationMs: number | null
    /** The failure message of the last run, or null. */
    readonly message: string | null
}

/** One mirrored file as the web reads it. */
export interface CourseLabFileView {
    /** The path. */
    readonly path: string
    /** The text, or null when the file is larger than the cap. */
    readonly text: string | null
    /** The SHA-256 (hex). */
    readonly sha256: string
}

/** The newest log lines of one service. */
export interface CourseLabLogView {
    /** The service (the check id of its log events). */
    readonly service: string
    /** The last 200 lines at most, oldest first. */
    readonly lines: ReadonlyArray<string>
}

/** One chaos switch as the web reads it. */
export interface CourseLabChaosView {
    /** The switch id. */
    readonly id: string
    /** The label the learner reads. */
    readonly label: string
}

/** The result of one hidden test of a graded submission; the test's own text and file never leave. */
export interface CourseLabSubmissionTestView {
    /** The hidden test id. */
    readonly id: string
    /** Whether it passed. */
    readonly passed: boolean
}

/** The learner's newest submission of a lab, practice level ("Đang luyện"): graded on the learner's machine. */
export interface CourseLabSubmissionView {
    /** The submission id. */
    readonly id: string
    /** queued, running, graded or rejected. */
    readonly status: LabSubmissionStatus
    /** True when graded and every hidden test passed. */
    readonly passed: boolean
    /** The stable reason code of a rejection, or null. */
    readonly rejectReason: LabGradeRejection | null
    /** The committed sha that was graded, or null. */
    readonly commit: string | null
    /** The hidden test results once graded (id and verdict only), else empty. */
    readonly tests: ReadonlyArray<CourseLabSubmissionTestView>
    /** The hints the learner opened. */
    readonly hintsOpened: number
    /** The time the learner spent, in milliseconds. */
    readonly timeSpentMs: number
    /** When it was submitted, ISO 8601. */
    readonly createdAt: string
    /** When it was graded or rejected, ISO 8601, or null. */
    readonly gradedAt: string | null
}

/** The lab of one lesson for the learner who asks: the state their machine last synced, never a hidden file. */
export interface CourseLabView {
    /** The course. */
    readonly courseId: string
    /** The lesson. */
    readonly lessonId: string
    /** `none` (no paired device), `offline` (paired, none online) or `online`. */
    readonly device: "none" | "offline" | "online"
    /** `setup` (nothing started), `booting` (stages reported, not ready) or `ready` (the first run is done). */
    readonly phase: "setup" | "booting" | "ready"
    /** The boot stages reported, in order. */
    readonly boot: ReadonlyArray<CourseLabBootView>
    /** The visible tests with the last run's results. */
    readonly tests: ReadonlyArray<CourseLabTestView>
    /** The files last synced. */
    readonly files: ReadonlyArray<CourseLabFileView>
    /** The log tail per service. */
    readonly logs: ReadonlyArray<CourseLabLogView>
    /** The chaos switches that are on. */
    readonly chaosOn: ReadonlyArray<string>
    /** Every chaos switch with its label. */
    readonly chaos: ReadonlyArray<CourseLabChaosView>
    /** When the machine last synced, ISO 8601, or null. */
    readonly lastSyncedAt: string | null
    /** True when state exists and the device is offline: the files shown are the last synced ones. */
    readonly connectionLost: boolean
    /** True once a submission passed: the lab repository's `main` branch holds the solution. */
    readonly solutionUnlocked: boolean
    /** The repository of the solution once unlocked, else null; its branch is `main`. */
    readonly solutionRepoUrl: string | null
    /** The newest submission, or null. */
    readonly latestSubmission: CourseLabSubmissionView | null
}

/** What a mutation of the lab answers: the device the manifest went to, the action and the manifest id. */
export interface CourseLabRequested {
    /** The name of the device the manifest went to. */
    readonly device: string
    /** What the machine was asked to do. */
    readonly action: LabAction
    /** The signed manifest id. */
    readonly manifestId: string
}

/** What a submit answers: the submission and where the manifest went. */
export interface CourseLabSubmitted extends CourseLabRequested {
    /** The submission id. */
    readonly submissionId: string
}

/** The pairing code the web issues: six digits and when it lapses. */
export interface RelayPairCode {
    /** Six digits. */
    readonly code: string
    /** The UTC instant it lapses, ISO 8601. */
    readonly expiresAt: string
}
