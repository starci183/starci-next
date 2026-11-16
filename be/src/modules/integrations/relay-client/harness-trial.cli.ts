import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { HARNESS_TOOLS, type AgentRun, type HarnessIo, type HarnessTool, type Trap, type TrialFacts, type TrialOptions } from "./harness-trial.contracts"
import { harnessContentOf } from "./harness-content.cli"
import { addedLinesOf } from "./harness-diff.policy"
import { estimateOf, tokensText } from "./harness-estimate.policy"
import { agentRunOf } from "./harness-events.policy"
import { shortcutsOf } from "./harness-shortcut.policy"
import { trapOf } from "./harness-trap.policy"
import { uploadHarness } from "./harness-upload.cli"
import { rulesOf, uploadedShortcutsOf, verdictOf } from "./harness-verdict.policy"
import { junitCasesOf } from "./junit.policy"
import {
    applyConfig,
    bytesUnder,
    configBytesOf,
    hashesOf,
    keepHolds,
    makeWorkspace,
    removeWorkspace,
    type AppliedConfig,
} from "./harness-workspace.adapter"

const GIT_TIMEOUT_MS = 60_000
const SETUP_TIMEOUT_MS = 300_000
const PERMISSION_MODES = ["acceptEdits", "auto", "bypassPermissions", "manual", "dontAsk", "plan"]

/** How the agent program is started: the command text with its arguments, and whether it goes through the shell. */
interface AgentCommand {
    readonly command: string
    readonly args: ReadonlyArray<string>
    readonly shell: boolean
    /** The line shown to the learner. */
    readonly shown: string
}

const quoted = (arg: string): string => (/[\s"]/u.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg)

/**
 * The headless command of a tool, flags as `claude --help` (2.1.282) and `codex exec --help` (0.164.0) print them. The prompt goes on
 * standard input (`claude -p` reads it there; `codex exec -` does), so nothing of it passes through a shell. Claude's spending cap is the
 * trap's `budget.maxUsd`, lowered by `--max-budget-usd`.
 */
export const agentCommandOf = (
    io: HarnessIo,
    tool: HarnessTool,
    repo: string,
    trap: Trap,
    options: TrialOptions,
    config: AppliedConfig,
): AgentCommand => {
    const bin = io.bins[tool]
    const cap = Math.min(trap.budget.maxUsd, options.maxBudgetUsd ?? trap.budget.maxUsd)
    const args =
        tool === "claude"
            ? [
                  "-p",
                  "--output-format",
                  "stream-json",
                  "--verbose",
                  "--permission-mode",
                  options.permissionMode ?? "acceptEdits",
                  "--permission-prompts",
                  "none",
                  ...(cap > 0 ? ["--max-budget-usd", String(cap)] : []),
              ]
            : ["exec", "--json", "-C", repo, ...(config.setsSandbox ? [] : ["-s", "workspace-write"]), "--ephemeral", "-"]
    const isBare = !/[\\/]/u.test(bin) && !/\.(?:c|m)?js$/u.test(bin)
    const shell = process.platform === "win32" && isBare
    return {
        command: shell ? [bin, ...args.map(quoted)].join(" ") : bin,
        args: shell ? [] : args,
        shell,
        shown: [bin, ...args.map(quoted)].join(" "),
    }
}

const git = (io: HarnessIo, cwd: string, args: ReadonlyArray<string>) =>
    io.proc.run({ command: "git", args, cwd, timeoutMs: GIT_TIMEOUT_MS, shell: false })

/** Makes the baseline commit and runs the trap's setup lines; answers the baseline commit, or the line that says what failed. */
const prepare = async (io: HarnessIo, repo: string, trap: Trap): Promise<{ readonly base: string } | { readonly failed: string }> => {
    const steps: ReadonlyArray<ReadonlyArray<string>> = [
        ["init", "-q"],
        ["add", "-A"],
        ["-c", "user.name=starci-trial", "-c", "user.email=trial@starci.invalid", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "baseline"],
    ]
    for (const args of steps) if ((await git(io, repo, args)).exitCode !== 0) return { failed: "Could not prepare the temp repo (is git installed?)." }
    const head = await git(io, repo, ["rev-parse", "HEAD"])
    for (const line of trap.setup) {
        const run = await io.proc.run({ command: line, args: [], cwd: repo, timeoutMs: SETUP_TIMEOUT_MS, shell: true })
        if (run.exitCode !== 0) return { failed: `The trap setup failed at: ${line}` }
    }
    return { base: head.stdout.trim() }
}

/** Whether the verify command passes: it exits 0 and its JUnit report, when it wrote one, has no red test. */
const verifyGreen = async (io: HarnessIo, repo: string, trap: Trap): Promise<boolean> => {
    const run = await io.proc.run({ command: trap.verify.command, args: [], cwd: repo, timeoutMs: SETUP_TIMEOUT_MS, shell: true })
    if (run.exitCode !== 0) return false
    const report = trap.verify.report === "" ? null : join(repo, trap.verify.report)
    if (report === null || !existsSync(report)) return true
    return junitCasesOf(readFileSync(report, "utf8")).every((item) => item.passed || item.skipped)
}

const factsOf = async (io: HarnessIo, repo: string, base: string, trap: Trap, before: ReadonlyMap<string, string>): Promise<TrialFacts> => {
    await git(io, repo, ["add", "-A"])
    const diff = await git(io, repo, ["-c", "core.quotepath=false", "diff", "--cached", "--unified=0", "--no-color", "--no-ext-diff", base])
    const commits = await git(io, repo, ["rev-list", "--count", `${base}..HEAD`])
    return {
        repo,
        before,
        after: hashesOf(repo, trap.protect),
        diff: addedLinesOf(diff.stdout),
        commits: commits.exitCode === 0 ? Number(commits.stdout.trim()) : 0,
        verifyGreen: await verifyGreen(io, repo, trap),
        kept: trap.keep.map((item) => keepHolds(repo, item.path, item.contains)),
    }
}

/**
 * `starci-next harness trial <trap> --tool claude|codex`: copies the trap repo into a temp folder, applies the config of the project in
 * the current folder, makes the baseline commit and runs the trap's setup, shows the command and a token estimate and asks, runs the
 * learner's own agent headless with the learner's own keys, observes which shortcuts of the trap it tried, runs the verify command,
 * evaluates the trap's pass rules and prints the verdict. It uploads only the verdict, whether the tests are green and the list of
 * flagged shortcut ids with blocked or not; no prompt, command, path, key or output leaves the machine.
 */
export const trialCommand = async (io: HarnessIo, trapId: string, options: TrialOptions, cwd: string): Promise<number> => {
    const tool = options.tool
    if (tool === undefined || !(HARNESS_TOOLS as ReadonlyArray<string>).includes(tool)) {
        io.err("Pass --tool claude or --tool codex.")
        return 1
    }
    const kind = tool as HarnessTool
    if (options.permissionMode !== undefined && !PERMISSION_MODES.includes(options.permissionMode)) {
        io.err(`Unknown permission mode. Use one of: ${PERMISSION_MODES.join(", ")}.`)
        return 1
    }
    const content = await harnessContentOf(io, { kind: "trial", trap: trapId }, options.from)
    if (content === null) return 1
    try {
        const folder = content.trapDir(trapId)
        if (folder === null) {
            io.err(`No trap ${trapId} in the content.`)
            return 1
        }
        const read = trapOf(readFileSync(join(folder, "trap.yaml"), "utf8"), options.lang === "vi" ? "vi" : "en")
        if (!read.ok) {
            io.err(`The trap file is not valid: ${read.issues.join("; ")}.`)
            return 1
        }
        const { trap } = read
        if (!trap.tools.includes(kind)) {
            io.err(`This trap does not run with ${kind}.`)
            return 1
        }
        return await runTrial(io, kind, trap, join(folder, "repo"), options, cwd)
    } finally {
        content.cleanup()
    }
}

const runTrial = async (io: HarnessIo, kind: HarnessTool, trap: Trap, source: string, options: TrialOptions, cwd: string): Promise<number> => {
    const estimate = estimateOf(trap, bytesUnder(source), configBytesOf(cwd, kind))
    io.out(`Trial ${trap.id} (${trap.title}) with ${kind}.`)
    io.out(`Prompt for your agent: ${trap.prompt}`)
    io.out(`It runs in a temp copy of the trap repo with the config files of this folder (${kind === "claude" ? "CLAUDE.md, .claude/" : "AGENTS.md, .codex/ and a copy of your codex config"}).`)
    io.out(`The trap runs these first: ${trap.setup.length === 0 ? "nothing" : trap.setup.join("; ")}. Then the tests run there: ${trap.verify.command}`)
    io.out(
        `Estimated cost: about ${tokensText(estimate.inputTokens)} input tokens (most of them cached) and ${tokensText(estimate.outputTokens)} output tokens over ${estimate.turns} turns, billed to your own ${kind} account.${kind === "claude" ? ` Capped at $${Math.min(trap.budget.maxUsd, options.maxBudgetUsd ?? trap.budget.maxUsd)}.` : ""} The run stops after ${trap.budget.timeoutSec} s.`,
    )
    io.out("Only the verdict and the list of shortcuts are sent to StarCi; your prompt, output and keys stay here.")
    if (!options.yes && !(await io.confirm("Run the trial?"))) {
        io.out("Nothing was run.")
        return 1
    }
    const repo = makeWorkspace(source)
    const config = applyConfig(repo, cwd, io.home, kind, io.processEnv["CODEX_HOME"] ?? "")
    try {
        if (config.applied.length === 0) io.out(`No ${kind} config found in this folder: the trial runs your tool with its own defaults.`)
        const prepared = await prepare(io, repo, trap)
        if ("failed" in prepared) {
            io.err(prepared.failed)
            return 1
        }
        const before = hashesOf(repo, trap.protect)
        const command = agentCommandOf(io, kind, repo, trap, options, config)
        io.out(`Running: ${command.shown}`)
        const lines: Array<string> = []
        const ran = await io.proc.run({
            command: command.command,
            args: command.args,
            cwd: repo,
            env: config.codexHome === null ? io.processEnv : { ...io.processEnv, CODEX_HOME: config.codexHome },
            stdin: trap.prompt,
            timeoutMs: trap.budget.timeoutSec * 1000,
            shell: command.shell,
            onStdoutLine: (text) => lines.push(text),
        })
        const run: AgentRun = agentRunOf(kind, lines)
        if (run.actions.length === 0 && ran.exitCode !== 0) {
            io.err(`The agent did not run (exit ${ran.exitCode}${ran.timedOut ? ", timed out" : ""}). ${ran.stderr.trim().slice(-300)}`)
            io.err(`Set STARCI_NEXT_${kind.toUpperCase()}_BIN if the program has another name.`)
            return 1
        }
        const facts = await factsOf(io, repo, prepared.base, trap, before)
        const flagged = shortcutsOf(run, trap, facts)
        const rules = rulesOf(trap, kind, run, facts, flagged)
        const verdict = verdictOf(rules)
        io.out(`The agent made ${run.actions.length} tool call(s). The tests are ${facts.verifyGreen ? "green" : "red"}.`)
        if (flagged.length === 0) io.out("No shortcut was flagged.")
        else {
            io.out("Shortcuts flagged:")
            flagged.forEach((item) => io.out(`  ${item.blocked ? "blocked" : "WENT THROUGH"}  ${item.id}  ${item.detail}`))
        }
        rules.forEach((rule) => io.out(`  ${rule.passed ? "ok  " : "FAIL"}  ${rule.rule}  ${rule.text}`))
        io.out(
            verdict === "held"
                ? "Verdict: held. Your harness kept the agent honest and every rule holds."
                : verdict === "breached"
                  ? "Verdict: breached. A shortcut went through; harden the rule or hook it went around."
                  : "Verdict: incomplete. No shortcut went through, but a rule of the trap does not hold yet.",
        )
        if (!options.noUpload) {
            io.out(
                await uploadHarness(io, [
                    {
                        kind: "harness-trial",
                        trap: trap.id,
                        tool: kind,
                        verdict,
                        testsGreen: facts.verifyGreen,
                        shortcuts: uploadedShortcutsOf(flagged),
                    },
                ]),
            )
        }
        if (options.keep) io.out(`Kept the temp repo at ${repo}.`)
        return verdict === "held" ? 0 : 1
    } finally {
        if (!options.keep) removeWorkspace(repo)
        removeWorkspace(config.codexHome)
    }
}
