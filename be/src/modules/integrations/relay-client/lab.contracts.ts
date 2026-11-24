/** What a lab manifest asks the learner's machine to do. */
export type LabAction = "boot" | "test" | "chaos" | "grade"

/** One failure the lab can inject: the environment variable and the value that switches it on. */
export interface LabChaos {
    /** The chaos id (`chaosOn` names it). */
    readonly id: string
    /** The environment variable the compose stack and the tests read. */
    readonly env: string
    /** The value that switches the failure on. */
    readonly value: string
}

/** One hidden test source of a grading run, written into a clean checkout for that run only. */
export interface LabHiddenFile {
    /** The path under the checkout, relative. */
    readonly path: string
    /** The sha256 (hex) of the decoded content. */
    readonly sha256: string
    /** The content, base64. Never uploaded anywhere. */
    readonly content: string
}

/** What a `grade` action adds: the submission it grades and the hidden files it grades with. */
export interface LabGrade {
    /** The submission being graded. */
    readonly submissionId: string
    /** The server's one-time nonce, part of what the device signs. */
    readonly nonce: string
    /** The order the seeds apply in (`STARCI_SEED_ORDER`). */
    readonly seedOrder: ReadonlyArray<string>
    /** The commit of the learner's clone to grade. */
    readonly commit: string
    /** The hidden files of the grading run. */
    readonly files: ReadonlyArray<LabHiddenFile>
}

/** The `lab` section of a verified manifest: only what the signature covers is ever read. */
export interface LabSection {
    /** The course the lab belongs to; the clone lives in `~/starci/<courseId>`. */
    readonly courseId: string
    /** The lesson of the lab. */
    readonly lessonId: string
    /** The learner's repository. */
    readonly repo: { readonly url: string; readonly branch: string; readonly commit: string | null }
    /** The compose file, relative to the clone. */
    readonly compose: string
    /** The compose project name. */
    readonly project: string
    /** The compose services whose logs are uploaded. */
    readonly services: ReadonlyArray<string>
    /** The seed command. */
    readonly seed: { readonly command: string; readonly timeoutMs: number }
    /** The test command, the JUnit report it writes (relative to where it runs) and its timeout. */
    readonly test: { readonly command: string; readonly report: string; readonly timeoutMs: number }
    /** The files the learner edits: the only paths watched and uploaded. */
    readonly files: ReadonlyArray<string>
    /** Every failure the lab can inject. */
    readonly chaos: ReadonlyArray<LabChaos>
    /** The chaos ids switched on now. */
    readonly chaosOn: ReadonlyArray<string>
    /** What to do. */
    readonly action: LabAction
    /** The grading run, present exactly when the action is `grade`. */
    readonly grade?: LabGrade
}

/** One test of a lab run as it is uploaded and, for a grade, signed. */
export interface LabTest {
    /** The test id: its `[test:<id>]` tag, else the slug of its name. */
    readonly id: string
    /** The test name without its tag. */
    readonly name: string
    /** True when it ran and did not fail. */
    readonly passed: boolean
    /** How long it took, in milliseconds. */
    readonly durationMs: number
    /** The failure message, at most 1000 characters; empty when it passed. */
    readonly message: string
}

/** One file of a `lab.files` upload. */
export interface LabFileSnapshot {
    /** The path, one of the lab's `files`. */
    readonly path: string
    /** The sha256 (hex) of the working-tree bytes. */
    readonly sha256: string
    /** The text, or null when the file is over 64 KiB or is not text. */
    readonly text: string | null
}

/** The stages of a boot. */
export type LabStage = "machine" | "clone" | "compose" | "seed" | "first-run"

/** What the learner's machine offers a lab: its folders, its numbers and a file watcher. Injected so a spec runs no docker and no watcher. */
export interface LabHost {
    /** The home folder; the clone lives in `<home>/starci/<course>`. */
    readonly home: () => string
    /** The free memory, in bytes. */
    readonly freeMemBytes: () => number
    /** The Node version, as `process.version` prints it. */
    readonly nodeVersion: () => string
    /** Watches the files of a folder; every raw change calls `onChange` with the changed path. */
    readonly watch: (
        root: string,
        paths: ReadonlyArray<string>,
        onChange: (path: string) => void,
    ) => { readonly close: () => void }
}
