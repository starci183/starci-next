/** The two locales every harness word exists in. */
export const HARNESS_LOCALES: ReadonlyArray<HarnessLocale> = ["vi", "en"]

/** A locale of the harness texts. */
export type HarnessLocale = "vi" | "en"

/** A text in both locales (CONTRACT.md `Localized`). */
export interface Localized {
    /** The Vietnamese text. */
    readonly vi: string
    /** The English text. */
    readonly en: string
}

/** The two tools the use part teaches. */
export const HARNESS_TOOLS: ReadonlyArray<HarnessTool> = ["claude", "codex"]

/** A tool of the use part. */
export type HarnessTool = "claude" | "codex"

/** The three parts of /harness: part 1 build, part 2 use, part 3 docs. */
export const HARNESS_PART_KEYS: ReadonlyArray<HarnessPartKey> = ["build", "use", "docs"]

/** A part key. */
export type HarnessPartKey = "build" | "use" | "docs"

/** How far one e2e, stage or build is: nothing, a relayed run (practising) or an attested CI run (proved). */
export type HarnessProofState = "none" | "practising" | "proved"

/** The kinds of stored harness content. */
export type HarnessContentKind = "build" | "guide" | "doc" | "probe" | "trap"

/** A text file of the raw content tree, its path relative to the content root. */
export interface HarnessRawFile {
    /** The posix path, `raw/harness/...`. */
    readonly path: string
    /** The text. */
    readonly text: string
}

/** One finding that refuses an import. */
export interface HarnessIssue {
    /** The file the finding names. */
    readonly path: string
    /** The stable code, `HARNESS_*`. */
    readonly code: string
    /** What is wrong. */
    readonly message: string
}

/** A text file stored with a record, its path relative to the record's folder. */
export interface HarnessFile {
    /** The path inside its folder. */
    readonly path: string
    /** The text. */
    readonly text: string
}

/** One tool key need of a build: the learner puts one of the names in their own `.env`. */
export interface HarnessKeyNeed {
    /** The need id. */
    readonly id: string
    /** The environment names any one of which satisfies it. */
    readonly anyOf: ReadonlyArray<string>
    /** A note for the learner, or null. */
    readonly note: Localized | null
}

/** One step of the guide of a stage. */
export interface HarnessStepRecord {
    /** The step id. */
    readonly id: string
    /** The position in the stage. */
    readonly order: number
    /** The title. */
    readonly title: Localized
    /** The markdown body. */
    readonly body: Localized
    /** The copy-run shell blocks. */
    readonly run: ReadonlyArray<string>
}

/** One stage of a build. */
export interface HarnessStageRecord {
    /** The stage id. */
    readonly id: string
    /** The position in the build. */
    readonly order: number
    /** The title. */
    readonly title: Localized
    /** The summary. */
    readonly summary: Localized
    /** The e2e test ids of the stage. */
    readonly e2e: ReadonlyArray<string>
    /** The guide steps. */
    readonly steps: ReadonlyArray<HarnessStepRecord>
}

/** How a build is installed and judged on the learner's machine. */
export interface HarnessRuntime {
    /** The project folder inside the pulled tree. */
    readonly dir: string
    /** The install command. */
    readonly install: string
    /** The e2e command. */
    readonly e2e: string
    /** The JUnit report the e2e command writes. */
    readonly report: string
}

/** A build of part 1 as the converter returns it. */
export interface HarnessBuildRecord {
    /** The build id. */
    readonly id: string
    /** The position among builds. */
    readonly order: number
    /** The title. */
    readonly title: Localized
    /** The summary. */
    readonly summary: Localized
    /** The tool key needs. */
    readonly keys: ReadonlyArray<HarnessKeyNeed>
    /** How it runs. */
    readonly runtime: HarnessRuntime
    /** The stages. */
    readonly stages: ReadonlyArray<HarnessStageRecord>
    /** The files of the pack the learner pulls (`source/**` and `e2e/**`, paths relative to the build folder). */
    readonly packFiles: ReadonlyArray<HarnessFile>
    /** The server-only hidden paths (listing only). */
    readonly hiddenPaths: ReadonlyArray<string>
    /** The SHA-256 over the path and text of every input file of the build. */
    readonly contentHash: string
}

/** One section of a guide or a doc. */
export interface HarnessSectionRecord {
    /** The section id. */
    readonly id: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: Localized
    /** The markdown body. */
    readonly body: Localized
    /** The copy-run shell blocks. */
    readonly run: ReadonlyArray<string>
}

/** A guide of part 2. */
export interface HarnessGuideRecord {
    /** The tool the guide teaches. */
    readonly tool: HarnessTool
    /** The slug. */
    readonly slug: string
    /** The position among the tool's guides. */
    readonly order: number
    /** The title. */
    readonly title: Localized
    /** The summary. */
    readonly summary: Localized
    /** The doctor probe ids that check the guide. */
    readonly probes: ReadonlyArray<string>
    /** The sections. */
    readonly sections: ReadonlyArray<HarnessSectionRecord>
    /** The content hash. */
    readonly contentHash: string
}

/** A doc of part 3. */
export interface HarnessDocRecord {
    /** The slug. */
    readonly slug: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: Localized
    /** The summary. */
    readonly summary: Localized
    /** The sections. */
    readonly sections: ReadonlyArray<HarnessSectionRecord>
    /** The content hash. */
    readonly contentHash: string
}

/** A doctor probe of part 2: the BE reads its header, the learner's CLI runs the yaml. */
export interface HarnessProbeRecord {
    /** The probe id. */
    readonly id: string
    /** The tool. */
    readonly tool: HarnessTool
    /** The position among the tool's probes. */
    readonly order: number
    /** The label. */
    readonly label: Localized
    /** The binaries it needs. */
    readonly needs: ReadonlyArray<string>
    /** The fail code to hint map. */
    readonly reasons: Readonly<Record<string, Localized>>
    /** The yaml text, verbatim. */
    readonly yaml: string
}

/** The doctor of one tool as a pack: the probe files and their fixtures. */
export interface HarnessDoctorPackRecord {
    /** The tool. */
    readonly tool: HarnessTool
    /** The files of `doctor/<tool>/**`, paths relative to that folder. */
    readonly files: ReadonlyArray<HarnessFile>
    /** The content hash. */
    readonly contentHash: string
}

/** A trap of the trial: the BE reads its header, the learner's CLI runs it. */
export interface HarnessTrapRecord {
    /** The trap id. */
    readonly id: string
    /** The position. */
    readonly order: number
    /** The label. */
    readonly label: Localized
    /** The prompt sent to the learner's own agent. */
    readonly task: string
    /** The tools it runs with. */
    readonly tools: ReadonlyArray<HarnessTool>
    /** The estimate, or null. */
    readonly estimate: { readonly turns: number; readonly outputTokensPerTurn: number } | null
    /** The files of the trap folder (`trap.yaml`, `repo/**`), paths relative to it. */
    readonly files: ReadonlyArray<HarnessFile>
    /** The content hash. */
    readonly contentHash: string
}

/** What the converter answers: every record and every finding. */
export interface HarnessConverted {
    /** The builds. */
    readonly builds: ReadonlyArray<HarnessBuildRecord>
    /** The guides. */
    readonly guides: ReadonlyArray<HarnessGuideRecord>
    /** The docs. */
    readonly docs: ReadonlyArray<HarnessDocRecord>
    /** The doctor probes. */
    readonly probes: ReadonlyArray<HarnessProbeRecord>
    /** The doctor packs, one per tool. */
    readonly doctorPacks: ReadonlyArray<HarnessDoctorPackRecord>
    /** The trial traps. */
    readonly traps: ReadonlyArray<HarnessTrapRecord>
    /** The findings; any finding refuses the import. */
    readonly issues: ReadonlyArray<HarnessIssue>
}

/** What an import is asked. */
export interface ImportHarnessParams {
    /** The content root that holds `raw/harness`. */
    readonly directory: string
    /** The version label, the content commit. */
    readonly ref: string
}

/** How one stored content item went. */
export type HarnessImportStatus = "created" | "unchanged" | "refused"

/** One line of an import report. */
export interface HarnessImportReport {
    /** The kind. */
    readonly kind: HarnessContentKind | "doctor-pack"
    /** The key. */
    readonly key: string
    /** What happened. */
    readonly status: HarnessImportStatus
}

/** The learner's newest relayed result of one check, as the relay answers it. */
export interface HarnessRunRow {
    /** The task id. */
    readonly taskId: string
    /** The check id (stage, probe or trap). */
    readonly checkId: string
    /** The ref (e2e id or tool), or null. */
    readonly ref: string | null
    /** Whether it passed. */
    readonly passed: boolean
    /** The commit, or null. */
    readonly commit: string | null
    /** The failure line or reason, or null. */
    readonly why: string | null
    /** The detail document of the result, or null. */
    readonly detail: Readonly<Record<string, unknown>> | null
    /** When it was stored, ISO 8601. */
    readonly at: string
}

/** One attested e2e result of a CI run. */
export interface HarnessProofRow {
    /** The build. */
    readonly buildId: string
    /** The stage. */
    readonly stageId: string
    /** The e2e id. */
    readonly e2eId: string
    /** Whether it passed. */
    readonly passed: boolean
    /** The CI run id. */
    readonly runId: string
    /** The commit. */
    readonly commit: string | null
    /** When it was recorded, ISO 8601. */
    readonly at: string
}

/** One section or step as a view reads it. */
export interface HarnessTextView {
    /** The id. */
    readonly id: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The markdown body. */
    readonly body: string
    /** The copy-run blocks. */
    readonly run: ReadonlyArray<string>
}

/** One e2e of a stage with its state. */
export interface HarnessE2eView {
    /** The e2e id. */
    readonly id: string
    /** The state. */
    readonly state: HarnessProofState
    /** Whether the newest result passed, null when none. */
    readonly passed: boolean | null
    /** The commit of the newest result. */
    readonly commit: string | null
    /** When the newest result was stored. */
    readonly at: string | null
}

/** One stage with its progress. */
export interface HarnessStageView {
    /** The stage id. */
    readonly id: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The summary. */
    readonly summary: string
    /** The state. */
    readonly state: HarnessProofState
    /** The e2e tests. */
    readonly e2e: ReadonlyArray<HarnessE2eView>
    /** The guide steps. */
    readonly steps: ReadonlyArray<HarnessTextView>
    /** When the newest relayed result was stored. */
    readonly lastRunAt: string | null
    /** The newest failure line. */
    readonly lastWhy: string | null
}

/** The repository binding of a build. */
export interface HarnessRepositoryView {
    /** Whether a project is bound. */
    readonly bound: boolean
    /** The project, or null. */
    readonly projectId: string | null
}

/** One key need as a view reads it. */
export interface HarnessKeyNeedView {
    /** The need id. */
    readonly id: string
    /** The environment names. */
    readonly anyOf: ReadonlyArray<string>
    /** The note, or null. */
    readonly note: string | null
}

/** One build as the list reads it. */
export interface HarnessBuildSummaryView {
    /** The build id. */
    readonly id: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The summary. */
    readonly summary: string
    /** The key needs. */
    readonly keys: ReadonlyArray<HarnessKeyNeedView>
    /** The number of stages. */
    readonly stageCount: number
    /** The stages at least practising. */
    readonly practisingStages: number
    /** The stages proved. */
    readonly provedStages: number
    /** The build state. */
    readonly state: HarnessProofState
}

/** One build with its stages. */
export interface HarnessBuildView extends HarnessBuildSummaryView {
    /** How it runs. */
    readonly runtime: HarnessRuntime
    /** The binding. */
    readonly repository: HarnessRepositoryView
    /** The stages. */
    readonly stages: ReadonlyArray<HarnessStageView>
}

/** One part of the hub. */
export interface HarnessPartView {
    /** The part key. */
    readonly key: HarnessPartKey
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The summary. */
    readonly summary: string
    /** How many items it has. */
    readonly total: number
    /** How many are practising. */
    readonly practising: number
    /** How many are proved. */
    readonly proved: number
    /** How many are done. */
    readonly done: number
    /** The next item to open, or null. */
    readonly nextId: string | null
}

/** The hub of /harness. */
export interface HarnessHubView {
    /** The three parts. */
    readonly parts: ReadonlyArray<HarnessPartView>
}

/** A guide as the list reads it. */
export interface HarnessGuideSummaryView {
    /** The tool. */
    readonly tool: HarnessTool
    /** The slug. */
    readonly slug: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The summary. */
    readonly summary: string
}

/** The status of a doctor probe the learner's CLI reported. */
export type HarnessProbeStatus = "passed" | "failed" | "skipped" | "invalid" | "not-run"

/** One probe with the learner's newest result. */
export interface HarnessProbeResultView {
    /** The probe id. */
    readonly id: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The guide slug that lists the probe, or null. */
    readonly guide: string | null
    /** The hint of the probe's first reason. */
    readonly fix: string | null
    /** The status. */
    readonly status: HarnessProbeStatus
    /** The fail code, or null. */
    readonly reason: string | null
    /** When it ran. */
    readonly at: string | null
}

/** A guide with its sections and the probes that check it. */
export interface HarnessGuideView extends HarnessGuideSummaryView {
    /** The sections. */
    readonly sections: ReadonlyArray<HarnessTextView>
    /** The probes of the guide. */
    readonly probes: ReadonlyArray<HarnessProbeResultView>
}

/** A doc as the list reads it. */
export interface HarnessDocSummaryView {
    /** The slug. */
    readonly slug: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The summary. */
    readonly summary: string
}

/** A doc with its sections. */
export interface HarnessDocView extends HarnessDocSummaryView {
    /** The sections. */
    readonly sections: ReadonlyArray<HarnessTextView>
}

/** The doctor of one tool. */
export interface HarnessDoctorView {
    /** The tool. */
    readonly tool: HarnessTool
    /** The probes. */
    readonly probes: ReadonlyArray<HarnessProbeResultView>
    /** How many passed. */
    readonly passed: number
    /** How many there are. */
    readonly total: number
}

/** One shortcut a trial observed. */
export interface HarnessShortcutView {
    /** The shortcut kind. */
    readonly kind: string
    /** Whether the agent's call was refused. */
    readonly blocked: boolean
}

/** The newest trial result of a trap. */
export interface HarnessTrialResultView {
    /** The tool. */
    readonly tool: HarnessTool
    /** The verdict: held, breached or incomplete. */
    readonly verdict: string
    /** Whether the tests ended green. */
    readonly testsGreen: boolean
    /** The shortcuts observed. */
    readonly shortcuts: ReadonlyArray<HarnessShortcutView>
    /** When it ran. */
    readonly at: string
}

/** A trap with the newest result. */
export interface HarnessTrapView {
    /** The trap id. */
    readonly id: string
    /** The position. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The prompt of the trap. */
    readonly task: string
    /** The tools. */
    readonly tools: ReadonlyArray<HarnessTool>
    /** The estimate, or null. */
    readonly estimate: { readonly turns: number; readonly outputTokensPerTurn: number } | null
    /** The newest result, or null. */
    readonly last: HarnessTrialResultView | null
}
