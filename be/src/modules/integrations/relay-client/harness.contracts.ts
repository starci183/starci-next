/** One key need of a build: satisfied when at least one of the variable NAMES is set on the learner's machine. Values are never read. */
export interface HarnessKey {
    /** The key id, for the table. */
    readonly id: string
    /** The variable names, any one of which satisfies the need (for example ANTHROPIC_API_KEY or OPENAI_API_KEY). */
    readonly anyOf: ReadonlyArray<string>
}

/** One stage of a build: its id and the e2e test ids a run must show green. */
export interface HarnessStageDef {
    /** The stage id. */
    readonly id: string
    /** The e2e ids of the stage; a test name carries `[<stage id>:<e2e id>]`. */
    readonly e2e: ReadonlyArray<string>
}

/** What the CLI needs of a build, whether it comes from the signed manifest or from the state file `pull` left. */
export interface HarnessPlan {
    /** The build id. */
    readonly buildId: string
    /** The project folder inside the unpacked tarball, relative to the build root. */
    readonly dir: string
    /** The install command, run from `dir` with `--install`. */
    readonly install: string
    /** The e2e command, run from `dir` once for all stages asked. */
    readonly e2e: string
    /** The JUnit report the e2e command writes, relative to the build root. */
    readonly report: string
    /** The key needs, checked by name only. */
    readonly keys: ReadonlyArray<HarnessKey>
    /** The stages in order; the number of a stage is its 1-based position. */
    readonly stages: ReadonlyArray<HarnessStageDef>
}

/** The `harness` section of a signed manifest of kind `build`. */
export interface HarnessBuildSection extends HarnessPlan {
    /** Always `build`. */
    readonly kind: "build"
    /** The tarball of `source/` plus `e2e/` (never `hidden/`): where to get it, its sha256 and the content commit it was cut at. */
    readonly source: { readonly url: string; readonly sha256: string; readonly commit: string }
}

/** The signed tarball of a harness section: where to get it, its sha256 and the content commit it was cut at. */
export interface HarnessSource {
    /** A path on StarCi's origin (device bearer) or an https URL (no bearer). */
    readonly url: string
    /** The sha256 of the tarball bytes. */
    readonly sha256: string
    /** The content commit the tarball was cut at. */
    readonly commit: string
}

/** The `harness` section of a signed manifest of kind `doctor` (task `harness:doctor:<tool>`): the probes of one tool. */
export interface HarnessDoctorSection {
    /** Always `doctor`. */
    readonly kind: "doctor"
    /** The tool the probes are for. */
    readonly tool: "claude" | "codex"
    /** The tarball of `doctor/<tool>/**` with its fixtures. */
    readonly source: HarnessSource
}

/** The `harness` section of a signed manifest of kind `trial` (task `harness:trial:<trap>`): one trap repo. */
export interface HarnessTrialSection {
    /** Always `trial`. */
    readonly kind: "trial"
    /** The trap id. */
    readonly trap: string
    /** The tarball of `trap.yaml` and `repo/**`. */
    readonly source: HarnessSource
}

/** A signed `harness` section of a kind the CLI does not know. */
export interface HarnessOtherSection {
    /** Always `other`. */
    readonly kind: "other"
    /** The kind as signed. */
    readonly name: string
}

/** The `harness` section of a verified manifest. */
export type HarnessSection =
    | HarnessBuildSection
    | HarnessDoctorSection
    | HarnessTrialSection
    | HarnessOtherSection

/** What `harness pull` leaves in the build folder (tracked in git, so CI can run `harness ci-report` without a device). */
export interface HarnessState extends HarnessPlan {
    /** The content commit the tarball was cut at. */
    readonly commit: string
    /** The sha256 of the tarball that was unpacked. */
    readonly sha256: string
}

/** The options of `harness e2e`. */
export interface HarnessE2eOptions {
    /** The stage to run: its 1-based number or its id; every stage when undefined. */
    readonly stage?: string | undefined
    /** Whether to run the signed install command first. */
    readonly install: boolean
    /** Whether to skip the question. */
    readonly yes: boolean
}

/** The options of `harness ci-report`. */
export interface HarnessCiReportOptions {
    /** The JUnit report to read; the one in the state file when undefined. */
    readonly report?: string | undefined
    /** The stage to report: its 1-based number or its id; every stage when undefined. */
    readonly stage?: string | undefined
}

/** How one e2e id of a stage came out. */
export interface E2eOutcome {
    /** The e2e id. */
    readonly id: string
    /** True when at least one tagged test ran and every test that ran passed. */
    readonly passed: boolean
    /** True when no tagged test ran at all. */
    readonly notRun: boolean
    /** The time of its tests, in milliseconds. */
    readonly timeMs: number
}

/** How one stage came out. */
export interface StageOutcome {
    /** The 1-based number of the stage. */
    readonly n: number
    /** The stage id. */
    readonly id: string
    /** The e2e outcomes in the order of the manifest. */
    readonly e2e: ReadonlyArray<E2eOutcome>
    /** True when every e2e passed. */
    readonly passed: boolean
    /** The time of the stage's tests, in milliseconds. */
    readonly timeMs: number
}
