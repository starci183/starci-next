import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { parse } from "yaml"
import { CheckFlowRunner, parseCheckFlow, systemFlowClock, type FlowVerdict } from "@modules/platform/check-flow"
import { expandPattern, localPlugins, NodeProcessPort, probeFlowOf, type CommandStub } from "./index"

/** Each case runs real git and node processes; a loaded machine needs more than the default 5 seconds. */
jest.setTimeout(60_000)

const FIXTURES = join(__dirname, "fixtures", "doctor")
const proc = new NodeProcessPort()
const ports = {
    transport: { send: () => Promise.resolve({ ok: false as const, error: "target-refused" }) },
    sink: null,
    clock: systemFlowClock,
}

interface Fixture {
    readonly files: Readonly<Record<string, string>>
    readonly env?: Readonly<Record<string, string>>
    readonly commands?: Readonly<Record<string, CommandStub>>
    readonly git?: { readonly config?: Readonly<Record<string, string>> }
}

interface Probe {
    readonly id: string
    readonly check: Record<string, unknown>
    readonly good: Fixture
    readonly bad: Fixture
}

const probesOf = (): ReadonlyArray<{ readonly name: string; readonly probe: Probe }> =>
    readdirSync(FIXTURES).flatMap((folder) =>
        readdirSync(join(FIXTURES, folder)).map((file) => ({
            name: `${folder}/${file}`,
            probe: parse(readFileSync(join(FIXTURES, folder, file), "utf8")) as Probe,
        })),
    )

const git = async (cwd: string, args: ReadonlyArray<string>) => proc.run({ command: "git", args, cwd, timeoutMs: 60_000, shell: false })

/** Writes a fixture into a scratch project and home, as the content repository's reference evaluator does, then runs the probe. */
const runFixture = async (probe: Probe, fixture: Fixture): Promise<{ verdict: FlowVerdict; why: string }> => {
    const base = mkdtempSync(join(tmpdir(), "starci-probe-spec-"))
    const project = join(base, "project")
    const home = join(base, "home")
    mkdirSync(project, { recursive: true })
    mkdirSync(home, { recursive: true })
    try {
        for (const [path, text] of Object.entries(fixture.files)) {
            const target = path.startsWith("~/") ? join(home, path.slice(2)) : join(project, path)
            mkdirSync(dirname(target), { recursive: true })
            writeFileSync(target, text)
            if (/(^|\/)(\.githooks|\.husky|hooks)\//u.test(path)) chmodSync(target, 0o755)
        }
        if ("git" in probe.check) {
            const identity = ["-c", "user.name=probe", "-c", "user.email=probe@example.invalid", "-c", `core.hooksPath=${join(base, "no-hooks")}`]
            await git(project, ["init", "-q"])
            await git(project, ["add", "-A"])
            await git(project, [...identity, "commit", "-q", "-m", "baseline"])
            for (const [key, value] of Object.entries(fixture.git?.config ?? {})) await git(project, ["config", key, value])
        }
        const local = localPlugins(proc, { project, home, env: fixture.env ?? {}, commands: fixture.commands ?? {} })
        const parsed = parseCheckFlow(probeFlowOf(probe.id, probe.check), undefined, local.plugins)
        if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues))
        const verdict = await new CheckFlowRunner(ports, local.plugins).run(parsed.flow, {
            base: "http://localhost",
            endpoint: null,
            sample: null,
            runId: "run-1",
        })
        return { verdict, why: local.why() }
    } finally {
        rmSync(base, { recursive: true, force: true })
    }
}

describe("the doctor probes of the content repository, through the check-flow plugins", () => {
    const all = probesOf()

    it("loads the fourteen probes of both tools", () => {
        expect(all.map((item) => item.name).filter((name) => name.startsWith("claude-code/"))).toHaveLength(8)
        expect(all.map((item) => item.name).filter((name) => name.startsWith("codex/"))).toHaveLength(6)
    })

    it.each(probesOf().map((item) => [item.name, item.probe] as const))("%s: the good fixture passes and the bad one fails", async (_name, probe) => {
        const good = await runFixture(probe, probe.good)
        const bad = await runFixture(probe, probe.bad)
        expect({ status: good.verdict.status, why: good.why }).toEqual({ status: "passed", why: good.why })
        expect(bad.verdict).toMatchObject({ status: "failed", reason: "check-failed" })
    })
})

describe("checks the fixtures do not cover", () => {
    const check = async (checkSpec: Record<string, unknown>, files: Record<string, string>, extra: { env?: Record<string, string>; commands?: Record<string, CommandStub> } = {}) =>
        runFixture({ id: "x", check: checkSpec, good: { files }, bad: { files: {} } }, { files, ...extra })

    it("file: minBytes, contains and matches each narrow the match, and a wildcard segment reads a folder", async () => {
        const files = { "docs/a.md": "# Rules\nnever skip hooks\n", ".claude/skills/one/SKILL.md": "---\nname: one\n---" }
        expect((await check({ file: { path: "docs/a.md", minBytes: 5, contains: "hooks", matches: "^# rules" } }, files)).verdict.status).toBe("passed")
        expect((await check({ file: { path: "docs/a.md", minBytes: 500 } }, files)).verdict.status).toBe("failed")
        expect((await check({ file: { path: "docs/a.md", contains: "absent" } }, files)).verdict.status).toBe("failed")
        expect((await check({ file: { path: ".claude/skills/*/SKILL.md", contains: "name:" } }, files)).verdict.status).toBe("passed")
        expect((await check({ file: { path: "docs/none.md" } }, files)).why).toBe("file not found")
    })

    it("json and toml: nonEmpty, equals, oneOf and matchesAll, arrays of several files joined", async () => {
        const files = {
            "a.json": JSON.stringify({ deny: ["Read(./.env)"], mode: "plan", empty: [] }),
            "b.json": JSON.stringify({ deny: ["Bash(rm -rf:*)"] }),
            "c.toml": 'approval_policy = "on-request"\n[mcp_servers.shop]\ncommand = "node"\n',
        }
        expect((await check({ json: { path: ["a.json", "b.json"], at: "deny", matchesAll: ["^Read", "^Bash\\(rm"] } }, files)).verdict.status).toBe("passed")
        expect((await check({ json: { path: "a.json", at: "mode", equals: "plan" } }, files)).verdict.status).toBe("passed")
        expect((await check({ json: { path: "a.json", at: "mode", equals: "auto" } }, files)).verdict.status).toBe("failed")
        expect((await check({ json: { path: "a.json", at: "empty", nonEmpty: true } }, files)).why).toBe("empty is empty")
        expect((await check({ json: { path: "a.json", at: "missing" } }, files)).why).toBe("missing is not set")
        expect((await check({ toml: { path: "c.toml", at: "approval_policy", oneOf: ["untrusted", "on-request"] } }, files)).verdict.status).toBe("passed")
        expect((await check({ toml: { path: "c.toml", at: "mcp_servers.shop.command", nonEmpty: true } }, files)).verdict.status).toBe("passed")
        expect((await check({ toml: { path: "c.toml", at: "approval_policy", oneOf: ["never"] } }, files)).why).toContain("is not one of")
    })

    it("env: a variable is set or is not", async () => {
        expect((await check({ env: { name: "ANTHROPIC_API_KEY", set: true } }, {}, { env: { ANTHROPIC_API_KEY: "k" } })).verdict.status).toBe("passed")
        expect((await check({ env: { name: "ANTHROPIC_API_KEY", set: false } }, {}, { env: { ANTHROPIC_API_KEY: "k" } })).verdict.status).toBe("failed")
        expect((await check({ env: { name: "ANTHROPIC_API_KEY", set: false } }, {}, { env: {} })).verdict.status).toBe("passed")
    })

    it("command: a stub in a fixture, and a real command otherwise", async () => {
        const stubbed = { commands: { "claude --version": { exitCode: 0, stdout: "2.1.0 (Claude Code)" } } }
        expect((await check({ command: { run: "claude --version", stdoutMatches: "Claude Code" } }, {}, stubbed)).verdict.status).toBe("passed")
        expect((await check({ command: { run: "claude --version", exitCode: 1 } }, {}, stubbed)).why).toBe("unexpected exit code")
        expect((await check({ command: { run: "codex --version" } }, {}, stubbed)).why).toBe("command has no stub in this fixture")
        const base = mkdtempSync(join(tmpdir(), "starci-cmd-"))
        try {
            const local = localPlugins(proc, { project: base, home: base, env: {} })
            const parsed = parseCheckFlow(probeFlowOf("real", { command: { run: "node -e process.exit(0)", exitCode: 3 } }), undefined, local.plugins)
            if (!parsed.ok) throw new Error("parse")
            const verdict = await new CheckFlowRunner(ports, local.plugins).run(parsed.flow, { base: "http://localhost", endpoint: null, sample: null, runId: "r" })
            expect(verdict.status).toBe("failed")
            const echoed = parseCheckFlow(probeFlowOf("real", { command: { run: "echo hello", stdoutMatches: "hello" } }), undefined, local.plugins)
            if (!echoed.ok) throw new Error("parse")
            expect((await new CheckFlowRunner(ports, local.plugins).run(echoed.flow, { base: "http://localhost", endpoint: null, sample: null, runId: "r" })).status).toBe("passed")
        } finally {
            rmSync(base, { recursive: true, force: true })
        }
    })

    it("hook inspect: a hook command or the script it names matches the regex", async () => {
        const files = {
            ".claude/settings.json": JSON.stringify({ hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "sh .claude/pre.sh" }] }] } }),
            ".claude/pre.sh": "npm test\n",
        }
        expect((await check({ hook: { config: ".claude/settings.json", inspect: { event: "PreToolUse", tool: "Bash", matches: "npm test" } } }, files)).verdict.status).toBe("passed")
        expect((await check({ hook: { config: ".claude/settings.json", inspect: { event: "PreToolUse", tool: "Edit", matches: "npm test" } } }, files)).verdict.status).toBe("failed")
    })

    it("a JSON deny answer of a hook blocks like exit 2", async () => {
        const files = {
            ".claude/settings.json": JSON.stringify({
                hooks: { PreToolUse: [{ hooks: [{ type: "command", command: `node -e "console.log(JSON.stringify({hookSpecificOutput:{permissionDecision:'deny'}}))"` }] }] },
            }),
        }
        const simulate = { event: "PreToolUse", tool: "Bash", cases: [{ input: { command: "rm -rf /" }, expect: "block" }] }
        expect((await check({ hook: { config: ".claude/settings.json", simulate } }, files)).verdict.status).toBe("passed")
    })

    it("git: a repo that is not one fails, and the scenario never touches the learner repo", async () => {
        expect((await check({ git: { simulate: { scenario: "env-file", expect: "reject" } } }, { "package.json": "{}" })).why).toBe("git accepted the commit")
    })
})

describe("probe documents and path patterns", () => {
    const parsedOf = (check: unknown) => {
        const local = localPlugins(proc, { project: ".", home: ".", env: {} })
        const flow = probeFlowOf("x", check as Record<string, unknown>)
        return flow === null ? null : parseCheckFlow(flow, undefined, local.plugins)
    }

    it("accepts exactly one known check and refuses anything else", () => {
        expect(probeFlowOf("x", { file: { path: "a" }, json: { path: "a", at: "b" } })).toBeNull()
        expect(probeFlowOf("x", { unknown: {} })).toBeNull()
        expect(probeFlowOf("x", "text" as unknown as Record<string, unknown>)).toBeNull()
    })

    it("lists every problem of a check's own fields", () => {
        const issues = (parsedOf({ json: { path: [], at: "" } }) ?? { ok: true }) as { ok: boolean; issues?: ReadonlyArray<{ at: string }> }
        expect(issues.ok).toBe(false)
        expect(issues.issues?.map((issue) => issue.at)).toEqual(expect.arrayContaining(["steps.0.json.path", "steps.0.json.at"]))
        expect(parsedOf({ env: { name: "lower", set: "yes" } })?.ok).toBe(false)
        expect(parsedOf({ command: { run: "rm -rf /" } })?.ok).toBe(false)
        expect(parsedOf({ hook: { config: "a" } })?.ok).toBe(false)
        expect(parsedOf({ hook: { config: "a", simulate: { event: "PreToolUse", tool: "Bash", cases: [] } } })?.ok).toBe(false)
        expect(parsedOf({ git: { simulate: { scenario: "nope", expect: "reject" } } })?.ok).toBe(false)
        expect(parsedOf({ file: "text" })?.ok).toBe(false)
        expect(parsedOf({ file: { path: "a" } })?.ok).toBe(true)
    })

    it("expands ~, lists and one wildcard segment", () => {
        const base = mkdtempSync(join(tmpdir(), "starci-expand-"))
        try {
            mkdirSync(join(base, "p", "skills", "a"), { recursive: true })
            mkdirSync(join(base, "h"), { recursive: true })
            writeFileSync(join(base, "p", "skills", "a", "SKILL.md"), "x")
            writeFileSync(join(base, "h", "c.toml"), "x")
            expect(expandPattern("skills/*/SKILL.md", join(base, "p"), join(base, "h"))).toHaveLength(1)
            expect(expandPattern("~/c.toml", join(base, "p"), join(base, "h"))).toHaveLength(1)
            expect(expandPattern("skills/*/nope.md", join(base, "p"), join(base, "h"))).toHaveLength(0)
            expect(existsSync(join(base, "p"))).toBe(true)
        } finally {
            rmSync(base, { recursive: true, force: true })
        }
    })
})
