/** What a lab manifest asks the learner's machine to do. */
export type LabAction = "boot" | "test" | "chaos" | "grade"

/** One failure the lab can inject: the two commands that switch it on and off, run in the lab folder against the running stack. */
export interface LabChaos {
    /** The chaos id (`chaosOn` names it). */
    readonly id: string
    /** The command that switches the failure on. */
    readonly on: string
    /** The command that switches the failure off. */
    readonly off: string
}

/** One hidden test source of a grading run, written into a clean checkout for that run only. */
export interface LabHiddenFile {
    /** The path under the lab folder, relative and already under the lab's grading folder. */
    readonly path: string
    /** The sha256 (hex) of the decoded content. */
    readonly sha256: string
    /** The content, base64. Never uploaded anywhere. */
    readonly content: string
}

/** What a `grade` action adds: the submission it grades, the command that runs the hidden tests and the hidden files. */
export interface LabGrade {
    /** The submission being graded. */
    readonly submissionId: string
    /** The server's one-time nonce, part of what the device signs. */
    readonly nonce: string
    /** The command that runs the hidden tests (it writes the test report); signed like every command of a manifest. */
    readonly command: string
    /** The hidden test ids in the order the run applies them (`STARCI_SEED_ORDER`); the report names each as `[scenario:<id>]`. */
    readonly seedOrder: ReadonlyArray<string>
    /** The hidden files of the grading run. */
    readonly files: ReadonlyArray<LabHiddenFile>
}

/** A tarball the machine fetches with its device token: the route on StarCi, the sha256 of its bytes and the commit it was cut at. */
export interface LabSource {
    /** The route on the StarCi origin. */
    readonly url: string
    /** The sha256 (hex) of the tarball bytes. */
    readonly sha256: string
    /** The commit the content was cut at (40 hex). */
    readonly commit: string
}

/** The `lab` section of a verified manifest: only what the signature covers is ever read. */
export interface LabSection {
    /** The course the lab belongs to. */
    readonly courseId: string
    /** The lesson of the lab; its folder is `~/starci/<courseId>/<lessonId>`. */
    readonly lessonId: string
    /** The lesson branch: what the learner gets, unpacked once into an empty folder. */
    readonly source: LabSource
    /** The solution, present only once a submission passed. */
    readonly solution?: LabSource
    /** The project folder inside the lab folder: every command runs there and the paths below are relative to it (`.` is the lab folder). */
    readonly dir: string
    /** The compose file, relative to `dir`. */
    readonly compose: string
    /** The compose project name. */
    readonly project: string
    /** The compose services whose logs are uploaded. */
    readonly services: ReadonlyArray<string>
    /** The seed command, when the lab names one. */
    readonly seed?: { readonly command: string; readonly timeoutMs: number }
    /** The test command, the per-scenario command template (it contains `{id}`), the JUnit report it writes and its timeout. */
    readonly test: {
        readonly command: string
        readonly scenario: string
        readonly report: string
        readonly timeoutMs: number
    }
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

/** The stages of a boot (`clone` is the source stage: the tarball is unpacked and committed as the baseline). */
export type LabStage = "machine" | "clone" | "compose" | "seed" | "first-run"

/** What the learner's machine offers a lab: its folders, its numbers and a file watcher. Injected so a spec runs no docker and no watcher. */
export interface LabHost {
    /** The home folder; a lab lives in `<home>/starci/<course>/<lesson>`. */
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
