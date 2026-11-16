import type { ProcessPort } from "@modules/platform/check-flow-local"
import type { CliIo } from "./relay-client.contracts"

/** The tools a learner's harness can be checked for. */
export const HARNESS_TOOLS = ["claude", "codex"] as const

/** One of the tools. */
export type HarnessTool = (typeof HARNESS_TOOLS)[number]

/** The folder of a tool's probes in the content (`raw/harness/doctor/<folder>`). */
export const DOCTOR_FOLDERS: Readonly<Record<HarnessTool, string>> = { claude: "claude-code", codex: "codex" }

/** Everything the doctor and trial commands touch beyond the relay commands: processes, the home folder and the agent programs. */
export interface HarnessIo extends CliIo {
    /** Runs processes on this machine. */
    readonly proc: ProcessPort
    /** The learner's home folder. */
    readonly home: string
    /** The agent programs; the tool's own name when absent. */
    readonly bins: Readonly<Record<HarnessTool, string>>
    /** The process environment (the learner's own keys live here and stay here). */
    readonly processEnv: Readonly<Record<string, string | undefined>>
}

/** The flags of `starci-next harness doctor`. */
export interface DoctorOptions {
    /** One tool, or both when absent. */
    readonly tool?: string | undefined
    /** A starci-next-data checkout to read the probes from. */
    readonly from?: string | undefined
    /** Run the shown commands without asking. */
    readonly yes: boolean
    /** Print the result as JSON. */
    readonly json: boolean
    /** Do not send the result to StarCi. */
    readonly noUpload: boolean
    /** The language of the labels and hints (vi or en). */
    readonly lang?: string | undefined
}

/** The flags of `starci-next harness trial`. */
export interface TrialOptions {
    /** The tool to run. */
    readonly tool?: string | undefined
    /** A starci-next-data checkout to read the trap from. */
    readonly from?: string | undefined
    /** Run without asking. */
    readonly yes: boolean
    /** Claude only: a lower spending cap than the trap's own, in US dollars. */
    readonly maxBudgetUsd?: number | undefined
    /** Claude only: the permission mode of the headless run. */
    readonly permissionMode?: string | undefined
    /** Do not send the verdict to StarCi. */
    readonly noUpload: boolean
    /** Keep the temp folder and print where it is. */
    readonly keep: boolean
    /** The language of the labels (vi or en). */
    readonly lang?: string | undefined
}

/** The status of one probe in a doctor result. */
export type DoctorProbeStatus = "passed" | "failed" | "skipped" | "invalid"

/** One probe in a doctor result. */
export interface DoctorProbeResult {
    /** The probe id. */
    readonly id: string
    /** How it ended. */
    readonly status: DoctorProbeStatus
    /** The stable reason code, absent for a pass. */
    readonly reason?: string
    /** Why, in one line (a failed check's reason, or the issues of an invalid file). */
    readonly why?: string
}

/** What `harness doctor --json` prints (CONTRACT.md "Doctor result"). */
export interface DoctorResult {
    /** Always `harness-doctor`. */
    readonly kind: "harness-doctor"
    /** The tool. */
    readonly tool: HarnessTool
    /** The probes in file order. */
    readonly probes: ReadonlyArray<DoctorProbeResult>
    /** The counts. */
    readonly summary: Readonly<Record<DoctorProbeStatus, number>>
}

/** One way the observer looks for a shortcut in a run (`shortcuts[].detect[]` of a trap). */
export interface Detect {
    /** Where to look: the commands the agent ran, the files it read or wrote, the added lines of the final diff, the final answer. */
    readonly in: "command" | "read" | "write" | "diff" | "message"
    /** A regex (flags imu) on the command, the added line or the text. */
    readonly matches?: string
    /** Globs of repo paths. */
    readonly paths?: ReadonlyArray<string>
    /** How many hits are needed; 1 when absent. */
    readonly atLeast?: number
    /** Flag the shortcut when there is no hit at all. */
    readonly absent?: boolean
}

/** A shortcut a trap watches for. */
export interface TrapShortcut {
    /** The shortcut id. */
    readonly id: string
    /** The title as the learner reads it. */
    readonly title: string
    /** The ways to find it; any one flags it. */
    readonly detect: ReadonlyArray<Detect>
}

/** One rule of the verdict of a tool. */
export interface PassRule {
    /** The rule name. */
    readonly rule: string
    /** The sentence the learner reads. */
    readonly text: string
    /** For `no-shortcut`: the shortcut ids that must not be flagged. */
    readonly shortcuts: ReadonlyArray<string>
    /** An attempt the tool's own guard stopped is reported but does not fail. */
    readonly tolerateBlocked: boolean
    /** A flagged shortcut is reported and the verdict stays pass. */
    readonly reportOnly: boolean
}

/** The trap a trial runs (CONTRACT.md "Trap"). */
export interface Trap {
    /** The trap id. */
    readonly id: string
    /** The title as the learner reads it. */
    readonly title: string
    /** The prompt given to the learner's agent. */
    readonly prompt: string
    /** The tools it runs for. */
    readonly tools: ReadonlyArray<HarnessTool>
    /** Shell lines run in the repo before the agent starts. */
    readonly setup: ReadonlyArray<string>
    /** How red or green is decided. */
    readonly verify: { readonly command: string; readonly report: string }
    /** The globs of the files hashed before and after. */
    readonly protect: ReadonlyArray<string>
    /** Files that must still exist after the run. */
    readonly keep: ReadonlyArray<{ readonly path: string; readonly contains: string | null }>
    /** The limits of the run. */
    readonly budget: { readonly maxUsd: number; readonly maxTurns: number; readonly timeoutSec: number }
    /** The shortcuts watched for. */
    readonly shortcuts: ReadonlyArray<TrapShortcut>
    /** The rules of the verdict, per tool. */
    readonly pass: Readonly<Record<HarnessTool, ReadonlyArray<PassRule>>>
}

/** What one tool call of the agent was, read from its event stream. */
export interface ToolAction {
    /** The call id. */
    readonly id: string
    /** A command, a read, a write, or something else. */
    readonly kind: "shell" | "read" | "write" | "other"
    /** The command text of a shell call. */
    readonly command: string
    /** The file paths the call names. */
    readonly paths: ReadonlyArray<string>
    /** True when the call ended in an error or a refusal, false when it went through, null when unknown. */
    readonly isError: boolean | null
    /** The exit code of a shell call when known. */
    readonly exitCode: number | null
}

/** What the event stream of one agent run held. */
export interface AgentRun {
    /** The tool calls in order. */
    readonly actions: ReadonlyArray<ToolAction>
    /** The final answer of the agent. */
    readonly message: string
    /** The input tokens the tool reported, when it did. */
    readonly inputTokens: number | null
    /** The output tokens the tool reported, when it did. */
    readonly outputTokens: number | null
}

/** What the repo looked like when the agent stopped, as the trial measured it. */
export interface TrialFacts {
    /** The temp repo folder. */
    readonly repo: string
    /** The hash of every protected file before the agent ran, by relative path. */
    readonly before: ReadonlyMap<string, string>
    /** The same after. */
    readonly after: ReadonlyMap<string, string>
    /** The files changed against the baseline and the lines added to each, by relative path. */
    readonly diff: ReadonlyMap<string, ReadonlyArray<string>>
    /** The number of commits on top of the baseline. */
    readonly commits: number
    /** Whether the verify command passes (exit 0 and no red test in its JUnit report). */
    readonly verifyGreen: boolean
    /** Whether each keep file still exists with its marker. */
    readonly kept: ReadonlyArray<boolean>
}

/** One shortcut the observer flagged. */
export interface FlaggedShortcut {
    /** The shortcut id. */
    readonly id: string
    /** True when every hit was a call the tool refused, so nothing went through. */
    readonly blocked: boolean
    /** What flagged it, for the learner's screen only; never uploaded. */
    readonly detail: string
}

/** The result of one rule. */
export interface RuleResult {
    /** The rule. */
    readonly rule: string
    /** Whether it holds. */
    readonly passed: boolean
    /** The sentence the learner reads. */
    readonly text: string
    /** The shortcut ids that make it fail. */
    readonly flagged: ReadonlyArray<string>
}

/** How a trial ended. */
export type TrialVerdict = "held" | "breached" | "incomplete"
