import { readFileSync } from "node:fs"
import { parse as parseToml } from "smol-toml"
import { isRecord } from "@modules/platform/primitives"
import type { CheckAnswer, LocalFlowEnv } from "./check-flow-local.contracts"
import type { ProcessPort } from "./check-flow-local.port"
import { filesOf, isNonEmpty, valueAt } from "./check-flow-local-path.policy"

/** The programs a `command` check may start; the learner sees the whole command before it runs. */
export const COMMAND_PROGRAMS: ReadonlyArray<string> = ["git", "node", "npm", "npx", "pnpm", "claude", "codex", "echo"]

const COMMAND_TIMEOUT_MS = 30_000
const FLAGS = "imu"

const pass = (why: string): CheckAnswer => ({ passed: true, why })
const fail = (why: string): CheckAnswer => ({ passed: false, why })

/** `file`: some file of `path` exists and holds the text, matches the regex and has the size. */
export const fileCheck = (spec: Record<string, unknown>, env: LocalFlowEnv): CheckAnswer => {
    const found = filesOf(spec["path"], env.project, env.home)
    if (found.length === 0) return fail("file not found")
    for (const file of found) {
        const text = readFileSync(file, "utf8")
        if (typeof spec["minBytes"] === "number" && Buffer.byteLength(text) < spec["minBytes"]) continue
        if (typeof spec["contains"] === "string" && !text.includes(spec["contains"])) continue
        if (typeof spec["matches"] === "string" && !new RegExp(spec["matches"], FLAGS).test(text)) continue
        return pass("found")
    }
    return fail("file found but its content is too small or misses the required text")
}

/** The value at `at` over every file that has it: arrays are joined, otherwise the first file that defines it wins. */
const valueOf = (spec: Record<string, unknown>, env: LocalFlowEnv, read: (text: string) => unknown): unknown => {
    let value: unknown
    for (const file of filesOf(spec["path"], env.project, env.home)) {
        let data: unknown
        try {
            data = read(readFileSync(file, "utf8"))
        } catch {
            continue
        }
        const found = valueAt(data, String(spec["at"]))
        if (found === undefined) continue
        if (Array.isArray(found) && Array.isArray(value)) value = [...(value as ReadonlyArray<unknown>), ...(found as ReadonlyArray<unknown>)]
        else if (value === undefined) value = found
    }
    return value
}

const checkValue = (spec: Record<string, unknown>, value: unknown): CheckAnswer => {
    const at = String(spec["at"])
    if (value === undefined) return fail(`${at} is not set`)
    if (spec["nonEmpty"] === true && !isNonEmpty(value)) return fail(`${at} is empty`)
    if (spec["equals"] !== undefined && JSON.stringify(value) !== JSON.stringify(spec["equals"])) return fail(`${at} is not the expected value`)
    const oneOf = spec["oneOf"]
    if (Array.isArray(oneOf) && !(oneOf as ReadonlyArray<unknown>).includes(value)) {
        return fail(`${at} is not one of ${(oneOf as ReadonlyArray<unknown>).join(", ")}`)
    }
    const patterns = spec["matchesAll"]
    if (Array.isArray(patterns)) {
        const items = (Array.isArray(value) ? (value as ReadonlyArray<unknown>) : [value]).filter((item) => typeof item === "string")
        for (const pattern of patterns as ReadonlyArray<string>) {
            if (!items.some((item) => new RegExp(pattern, FLAGS).test(String(item)))) return fail(`no ${at} entry matches ${pattern}`)
        }
    }
    return pass(`${at} ok`)
}

/** `json`: the value at a dotted key of the first JSON file that has it satisfies nonEmpty, equals, oneOf, matchesAll. */
export const jsonCheck = (spec: Record<string, unknown>, env: LocalFlowEnv): CheckAnswer =>
    checkValue(spec, valueOf(spec, env, (text) => JSON.parse(text) as unknown))

/** `toml`: the same over TOML files. */
export const tomlCheck = (spec: Record<string, unknown>, env: LocalFlowEnv): CheckAnswer =>
    checkValue(spec, valueOf(spec, env, (text) => parseToml(text) as unknown))

/** `env`: a variable is set (non-empty) or is not. */
export const envCheck = (spec: Record<string, unknown>, env: LocalFlowEnv): CheckAnswer => {
    const name = String(spec["name"])
    const value = env.env[name]
    return {
        passed: (typeof value === "string" && value !== "") === (spec["set"] === true),
        why: `${name} ${spec["set"] === true ? "must be set" : "must not be set"}`,
    }
}

/** `command`: runs the command (or reads its stub) and checks the exit code and the output. */
export const commandCheck = async (spec: Record<string, unknown>, env: LocalFlowEnv, proc: ProcessPort): Promise<CheckAnswer> => {
    const run = String(spec["run"])
    const stub = env.commands?.[run]
    const result =
        env.commands !== undefined
            ? stub === undefined
                ? null
                : { exitCode: stub.exitCode ?? 0, stdout: stub.stdout ?? "" }
            : await proc.run({ command: run, args: [], cwd: env.project, timeoutMs: COMMAND_TIMEOUT_MS, shell: true })
    if (result === null) return fail("command has no stub in this fixture")
    const wanted = typeof spec["exitCode"] === "number" ? spec["exitCode"] : 0
    if (env.commands === undefined ? result.exitCode !== wanted : spec["exitCode"] !== undefined && result.exitCode !== wanted) {
        return fail("unexpected exit code")
    }
    if (typeof spec["stdoutMatches"] === "string" && !new RegExp(spec["stdoutMatches"], "u").test(result.stdout)) return fail("stdout does not match")
    return pass("command ok")
}

/** Whether a check spec is a map. */
export const isSpec = (value: unknown): value is Record<string, unknown> => isRecord(value)
