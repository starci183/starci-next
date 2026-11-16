import type { FlowPlugin } from "@modules/platform/check-flow"

/** The schema a doctor probe names (the content repository's `schemas/harness-probe.schema.json`). */
export const HARNESS_PROBE_SCHEMA = "starci/harness-probe@1"

/** The checks a probe may hold, exactly one per probe. Each is also the step key of a plugin. */
export const CHECK_KEYS = ["file", "json", "toml", "env", "command", "hook", "git"] as const

/** One check key. */
export type CheckKey = (typeof CHECK_KEYS)[number]

/** What a spec says a command printed instead of running it (the `commands` of a fixture). */
export interface CommandStub {
    /** The exit code, 0 when absent. */
    readonly exitCode?: number
    /** The standard output. */
    readonly stdout?: string
}

/** What a check may read of the learner's machine; fixed for one probe run. */
export interface LocalFlowEnv {
    /** The learner's project folder, the base of a relative path. */
    readonly project: string
    /** The learner's home folder, what `~/` means. */
    readonly home: string
    /** The environment an `env` check reads. */
    readonly env: Readonly<Record<string, string | undefined>>
    /** Stubs for `command` checks (a fixture's `commands`); when absent a `command` check really runs the command. */
    readonly commands?: Readonly<Record<string, CommandStub>>
}

/** A check of the learner's machine: a shared-interpreter plugin that also lists the commands the learner must be shown first. */
export interface LocalFlowPlugin extends FlowPlugin {
    /** The command texts to show the learner before the flow runs (a command, a hook command, a scratch commit). */
    commands?(params: unknown): ReadonlyArray<string>
}

/** The answer of one check. */
export interface CheckAnswer {
    /** Whether the check holds. */
    readonly passed: boolean
    /** Why, in one line. */
    readonly why: string
}
