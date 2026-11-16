/**
 * The local check-flow primitives (platform): the plugins a learner's machine adds to the shared check-flow language
 * (`@modules/platform/check-flow`) so a doctor probe can check files, JSON and TOML values, the environment, a command, Claude
 * Code hooks and a git commit. Names and semantics follow the content repository's `schemas/harness-probe.schema.json` and its
 * reference evaluator `scripts/validate-harness.mjs`. The server never registers them, so its schema refuses a doctor file.
 * `probeFlowOf` turns a probe document into the one-step flow the interpreter runs.
 */
import { isRecord } from "@modules/platform/primitives"
import { CHECK_KEYS, type CheckKey, type LocalFlowEnv, type LocalFlowPlugin } from "./check-flow-local.contracts"
import type { ProcessPort } from "./check-flow-local.port"
import { CHECK_PASSED, checkPlugins, type WhySink } from "./check-flow-local-plugins.adapter"

export type { CheckAnswer, CheckKey, CommandStub, LocalFlowEnv, LocalFlowPlugin } from "./check-flow-local.contracts"
export { CHECK_KEYS, HARNESS_PROBE_SCHEMA } from "./check-flow-local.contracts"
export type { ProcessPort, ProcessResult, ProcessSpec } from "./check-flow-local.port"
export { NodeProcessPort } from "./check-flow-local-process.adapter"
export { CHECK_FAILED, CHECK_PASSED, LOCAL_NEEDS } from "./check-flow-local-plugins.adapter"
export { COMMAND_PROGRAMS } from "./check-flow-local-values.adapter"
export { expandPattern } from "./check-flow-local-path.policy"

/** The primitives of one probe run and the reason of its last check. */
export interface LocalPlugins {
    /** The primitives, to hand to the interpreter's schema and runner. */
    readonly plugins: ReadonlyArray<LocalFlowPlugin>
    /** The reason the last check gave, for the line the learner reads. */
    why(): string
}

/** The check primitives over the process port, for one learner machine. */
export const localPlugins = (proc: ProcessPort, env: LocalFlowEnv): LocalPlugins => {
    const sink: WhySink = { why: "" }
    return { plugins: checkPlugins(proc, env, sink), why: () => sink.why }
}

/** The check key a probe holds, or null unless it holds exactly one and nothing else. */
export const checkKeyOf = (check: unknown): CheckKey | null => {
    if (!isRecord(check)) return null
    const keys = Object.keys(check)
    const [only] = keys
    return keys.length === 1 && (CHECK_KEYS as ReadonlyArray<string>).includes(String(only)) ? (only as CheckKey) : null
}

/**
 * The document the interpreter runs for a probe: one step whose key is the check (`file`, `json`, ...), asserting the check
 * answered 200. A failing run's reason is `check-failed`; `LocalPlugins.why` says why.
 */
export const probeFlowOf = (id: string, check: Record<string, unknown>): Record<string, unknown> | null => {
    const key = checkKeyOf(check)
    return key === null
        ? null
        : {
              id,
              steps: [{ id: "check", [key]: check[key], expect: [{ that: "status", eq: CHECK_PASSED, fail: "check-failed" }] }],
              pass: "check-passed",
          }
}
