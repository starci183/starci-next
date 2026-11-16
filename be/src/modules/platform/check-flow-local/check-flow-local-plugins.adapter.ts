import { spawnSync } from "node:child_process"
import type { FlowPluginContext, FlowResponse } from "@modules/platform/check-flow"
import { isRecord } from "@modules/platform/primitives"
import type { CheckAnswer, CheckKey, LocalFlowEnv, LocalFlowPlugin } from "./check-flow-local.contracts"
import type { ProcessPort } from "./check-flow-local.port"
import { isPathSpec } from "./check-flow-local-path.policy"
import { gitCheck, hookCheck, hookCommandsOf } from "./check-flow-local-repo.adapter"
import { COMMAND_PROGRAMS, commandCheck, envCheck, fileCheck, jsonCheck, tomlCheck } from "./check-flow-local-values.adapter"

/** The binaries a probe may list in `needs`; the `command` check answers them. */
export const LOCAL_NEEDS: ReadonlyArray<string> = ["git", "node", "npm", "claude", "codex"]

/** The status a check answers when it holds, and when it does not (a refused precondition, like HTTP 412). */
export const CHECK_PASSED = 200
export const CHECK_FAILED = 412

/** Where the plugins leave the reason of the last check, for the line the learner reads. */
export interface WhySink {
    /** The reason of the last check that ran. */
    why: string
}

type Issue = (at: string, message: string) => void

const needsText = (spec: Record<string, unknown>, key: string, at: string, issue: Issue): void => {
    if (typeof spec[key] !== "string" || spec[key] === "") issue(`${at}.${key}`, "must be a non-empty string")
}

const parsers: Readonly<Record<CheckKey, (spec: Record<string, unknown>, at: string, issue: Issue) => void>> = {
    file: (spec, at, issue) => {
        if (!isPathSpec(spec["path"])) issue(`${at}.path`, "must be a path or a list of paths")
    },
    json: (spec, at, issue) => {
        if (!isPathSpec(spec["path"])) issue(`${at}.path`, "must be a path or a list of paths")
        needsText(spec, "at", at, issue)
    },
    toml: (spec, at, issue) => {
        if (!isPathSpec(spec["path"])) issue(`${at}.path`, "must be a path or a list of paths")
        needsText(spec, "at", at, issue)
    },
    env: (spec, at, issue) => {
        if (typeof spec["name"] !== "string" || !/^[A-Z][A-Z0-9_]*$/u.test(spec["name"])) issue(`${at}.name`, "must be an upper-case variable name")
        if (typeof spec["set"] !== "boolean") issue(`${at}.set`, "must be true or false")
    },
    command: (spec, at, issue) => {
        needsText(spec, "run", at, issue)
        const program = String(spec["run"] ?? "").trim().split(/\s+/u)[0] ?? ""
        if (typeof spec["run"] === "string" && !COMMAND_PROGRAMS.includes(program)) {
            issue(`${at}.run`, `the program must be one of ${COMMAND_PROGRAMS.join(", ")}`)
        }
    },
    hook: (spec, at, issue) => {
        if (!isPathSpec(spec["config"])) issue(`${at}.config`, "must be a path or a list of paths")
        if (isRecord(spec["simulate"]) === isRecord(spec["inspect"])) issue(at, "needs exactly one of simulate, inspect")
        const simulate = spec["simulate"]
        if (isRecord(simulate) && !(Array.isArray(simulate["cases"]) && simulate["cases"].length > 0 && typeof simulate["event"] === "string" && typeof simulate["tool"] === "string")) {
            issue(`${at}.simulate`, "needs an event, a tool and at least one case")
        }
        const inspect = spec["inspect"]
        if (isRecord(inspect) && (typeof inspect["event"] !== "string" || typeof inspect["matches"] !== "string")) {
            issue(`${at}.inspect`, "needs an event and a matches regex")
        }
    },
    git: (spec, at, issue) => {
        const simulate = spec["simulate"]
        const ok =
            isRecord(simulate) &&
            ["red-test", "env-file"].includes(String(simulate["scenario"])) &&
            ["reject", "accept"].includes(String(simulate["expect"]))
        if (!ok) issue(`${at}.simulate`, "needs a scenario (red-test, env-file) and an expect (reject, accept)")
    },
}

/** The primitives a probe's one check turns into: each check key is a step key of the check-flow language on the learner's machine. */
export const checkPlugins = (proc: ProcessPort, env: LocalFlowEnv, sink: WhySink): ReadonlyArray<LocalFlowPlugin> => {
    const runs: Readonly<Record<CheckKey, (spec: Record<string, unknown>) => CheckAnswer | Promise<CheckAnswer>>> = {
        file: (spec) => fileCheck(spec, env),
        json: (spec) => jsonCheck(spec, env),
        toml: (spec) => tomlCheck(spec, env),
        env: (spec) => envCheck(spec, env),
        command: (spec) => commandCheck(spec, env, proc),
        hook: (spec) => hookCheck(spec, env, proc),
        git: (spec) => gitCheck(spec, env, proc),
    }
    const commands = (key: CheckKey, spec: Record<string, unknown>): ReadonlyArray<string> => {
        if (key === "command") return [String(spec["run"])]
        if (key === "git") return ["a scratch commit in a copy of this repo (its own git hooks run)"]
        if (key === "hook" && isRecord(spec["simulate"])) {
            return hookCommandsOf(spec, env, String(spec["simulate"]["event"]), String(spec["simulate"]["tool"]))
        }
        return []
    }
    const plugin = (key: CheckKey): LocalFlowPlugin => ({
        key,
        ...(key === "command" ? { needs: LOCAL_NEEDS, meets: (need: string) => spawnSync(need, ["--version"], { shell: process.platform === "win32", windowsHide: true, timeout: 15_000 }).status === 0 } : {}),
        parse: (raw, at, issue) => {
            if (!isRecord(raw)) {
                issue(at, "must be a map")
                return {}
            }
            parsers[key](raw, at, issue)
            return raw
        },
        perform: async (params: unknown, _context: FlowPluginContext): Promise<FlowResponse> => {
            const started = performance.now()
            const answer = await runs[key](params as Record<string, unknown>)
            sink.why = answer.why
            return {
                status: answer.passed ? CHECK_PASSED : CHECK_FAILED,
                headers: { "x-check-why": answer.why },
                body: answer.why,
                ms: Math.round(performance.now() - started),
            }
        },
        commands: (params) => commands(key, params as Record<string, unknown>),
    })
    return (["file", "json", "toml", "env", "command", "hook", "git"] as const).map(plugin)
}
