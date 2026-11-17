import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { isRecord } from "@modules/platform/primitives"
import type { CheckAnswer, LocalFlowEnv } from "./check-flow-local.contracts"
import type { ProcessPort } from "./check-flow-local.port"
import { filesOf } from "./check-flow-local-path.policy"

const HOOK_TIMEOUT_MS = 30_000
const GIT_TIMEOUT_MS = 120_000
const FLAGS = "imu"

const pass = (why: string): CheckAnswer => ({ passed: true, why })
const fail = (why: string): CheckAnswer => ({ passed: false, why })

const readJson = (file: string): unknown => {
    try {
        return JSON.parse(readFileSync(file, "utf8")) as unknown
    } catch {
        return undefined
    }
}

/** The command hooks of the config files registered for an event whose matcher fits the tool. */
export const hookCommandsOf = (
    spec: Record<string, unknown>,
    env: LocalFlowEnv,
    event: string,
    tool: string | undefined,
): ReadonlyArray<string> =>
    filesOf(spec["config"], env.project, env.home).flatMap((file) => {
        const data = readJson(file)
        const hooks = isRecord(data) && isRecord(data["hooks"]) ? data["hooks"][event] : undefined
        if (!Array.isArray(hooks)) return []
        return (hooks as ReadonlyArray<unknown>).flatMap((group) => {
            if (!isRecord(group)) return []
            const matcher = typeof group["matcher"] === "string" ? group["matcher"] : ""
            if (
                tool !== undefined &&
                matcher !== "" &&
                matcher !== "*" &&
                !new RegExp(`^(?:${matcher})$`, "u").test(tool)
            )
                return []
            const inner = Array.isArray(group["hooks"]) ? (group["hooks"] as ReadonlyArray<unknown>) : []
            return inner.flatMap((hook) =>
                isRecord(hook) && hook["type"] === "command" && typeof hook["command"] === "string"
                    ? [hook["command"]]
                    : [],
            )
        })
    })

type HookVerdict = "block" | "allow" | "error"

const runHook = async (
    command: string,
    payload: unknown,
    env: LocalFlowEnv,
    proc: ProcessPort,
): Promise<HookVerdict> => {
    const root = env.project.replaceAll("\\", "/")
    const text = command.replace(/"\$CLAUDE_PROJECT_DIR"|\$CLAUDE_PROJECT_DIR|\$\{CLAUDE_PROJECT_DIR\}/gu, `"${root}"`)
    const run = await proc.run({
        command: text,
        args: [],
        cwd: env.project,
        env: { ...process.env, CLAUDE_PROJECT_DIR: env.project, HOME: env.home, USERPROFILE: env.home },
        stdin: JSON.stringify(payload),
        timeoutMs: HOOK_TIMEOUT_MS,
        shell: true,
    })
    if (run.exitCode === 2) return "block"
    if (run.exitCode !== 0) return "error"
    try {
        const answer: unknown = JSON.parse(run.stdout)
        const specific = isRecord(answer) ? answer["hookSpecificOutput"] : undefined
        if (
            isRecord(answer) &&
            (answer["decision"] === "block" || (isRecord(specific) && specific["permissionDecision"] === "deny"))
        )
            return "block"
    } catch {
        /* plain output is not a decision */
    }
    return "allow"
}

const inspectHook = (
    spec: Record<string, unknown>,
    inspect: Record<string, unknown>,
    env: LocalFlowEnv,
): CheckAnswer => {
    const regex = new RegExp(String(inspect["matches"]), FLAGS)
    const tool = typeof inspect["tool"] === "string" ? inspect["tool"] : undefined
    for (const command of hookCommandsOf(spec, env, String(inspect["event"]), tool)) {
        const texts = [command]
        for (const token of command.split(/\s+/u)) {
            const path = token.replace(/^["']|["']$/gu, "").replace(/^\$\{?CLAUDE_PROJECT_DIR\}?\/?/u, "")
            const file = join(env.project, path)
            if (path !== "" && existsSync(file) && statSync(file).isFile()) texts.push(readFileSync(file, "utf8"))
        }
        if (regex.test(texts.join("\n"))) return pass("a hook command runs the tests")
    }
    return fail(`no ${String(inspect["event"])} hook for ${tool ?? "any tool"} runs the tests`)
}

/** `hook`: simulates Claude Code's hook JSON on every registered command for the event and tool, or inspects what a hook runs. */
export const hookCheck = async (
    spec: Record<string, unknown>,
    env: LocalFlowEnv,
    proc: ProcessPort,
): Promise<CheckAnswer> => {
    if (isRecord(spec["inspect"])) return inspectHook(spec, spec["inspect"], env)
    const simulate = spec["simulate"] as {
        event: string
        tool: string
        cases: ReadonlyArray<{ input: { command: string }; expect: string }>
    }
    const commands = hookCommandsOf(spec, env, simulate.event, simulate.tool)
    if (commands.length === 0) return fail(`no ${simulate.event} hook for ${simulate.tool}`)
    for (const item of simulate.cases) {
        const payload = {
            hook_event_name: simulate.event,
            tool_name: simulate.tool,
            tool_input: item.input,
            cwd: env.project,
        }
        const verdicts = await Promise.all(commands.map((command) => runHook(command, payload, env, proc)))
        const verdict = verdicts.includes("block") ? "block" : verdicts.includes("error") ? "error" : "allow"
        if (verdict !== item.expect) return fail(`"${item.input.command}" was ${verdict}, expected ${item.expect}`)
    }
    return pass(`${simulate.cases.length} calls judged as expected`)
}

const git = (proc: ProcessPort, cwd: string, args: ReadonlyArray<string>) =>
    proc.run({ command: "git", args, cwd, timeoutMs: GIT_TIMEOUT_MS, shell: false })

/**
 * `git`: in a scratch copy of the repo (never the learner's own), applies a scenario (`red-test` makes the test script fail,
 * `env-file` force-stages a `.env`), stages everything and runs a real `git commit` so the repo's own hooks decide.
 */
export const gitCheck = async (
    spec: Record<string, unknown>,
    env: LocalFlowEnv,
    proc: ProcessPort,
): Promise<CheckAnswer> => {
    const { scenario, expect } = spec["simulate"] as { scenario: string; expect: string }
    if ((await git(proc, env.project, ["rev-parse", "--git-dir"])).exitCode !== 0) return fail("not a git repository")
    const scratch = mkdtempSync(join(tmpdir(), "starci-git-probe-"))
    const repo = join(scratch, "repo")
    try {
        cpSync(env.project, repo, {
            recursive: true,
            filter: (source) => !/[\\/]node_modules(?:[\\/]|$)/u.test(source),
        })
        if (scenario === "red-test") {
            const file = join(repo, "package.json")
            const data = (existsSync(file) ? readJson(file) : undefined) as Record<string, unknown> | undefined
            const scripts = isRecord(data?.["scripts"]) ? data["scripts"] : {}
            writeFileSync(
                file,
                JSON.stringify(
                    {
                        name: "probe",
                        private: true,
                        ...data,
                        scripts: { ...scripts, test: 'node -e "process.exit(1)"' },
                    },
                    null,
                    2,
                ),
            )
            mkdirSync(join(repo, "starci-probe"), { recursive: true })
            writeFileSync(join(repo, "starci-probe", "red-test.txt"), "red test probe\n")
            await git(proc, repo, ["add", "-A"])
        } else {
            writeFileSync(join(repo, ".env"), "STARCI_PROBE=1\n")
            await git(proc, repo, ["add", "-f", "--", ".env"])
        }
        const commit = await git(proc, repo, [
            "-c",
            "user.name=probe",
            "-c",
            "user.email=probe@example.invalid",
            "commit",
            "-q",
            "-m",
            "starci probe",
        ])
        const rejected = commit.exitCode !== 0
        return {
            passed: rejected === (expect === "reject"),
            why: rejected ? "git rejected the commit" : "git accepted the commit",
        }
    } finally {
        rmSync(scratch, { recursive: true, force: true })
    }
}
