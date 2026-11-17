import { envNamesIn, harnessOf, harnessStateOf, keyCheckOf, stagesAsked } from "./harness.policy"
import { stageOutcomesOf, stageTableOf } from "./harness-report.policy"
import { scenarioCasesOf } from "./scenario-report.policy"

const COMMIT = "c".repeat(40)

const build = (extra: Record<string, unknown> = {}) => ({
    kind: "build",
    buildId: "agent-cli",
    source: { url: "/relay/harness/build/agent-cli/source.tgz", sha256: "e".repeat(64), commit: COMMIT },
    dir: "source",
    install: "npm ci",
    e2e: "npm run e2e",
    report: "e2e/reports/junit.xml",
    keys: [{ id: "llm", anyOf: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] }],
    stages: [
        { id: "s1-loop", e2e: ["loop-calls-tool", "loop-stops"] },
        { id: "s2-tools", e2e: ["tool-schema"] },
    ],
    ...extra,
})

describe("harness policy", () => {
    it("reads a signed build section and names a kind it does not know", () => {
        expect(harnessOf(build())).toMatchObject({ kind: "build", buildId: "agent-cli", dir: "source" })
        expect(harnessOf(undefined)).toBeUndefined()
        expect(harnessOf({ kind: "future" })).toEqual({ kind: "other", name: "future" })
    })

    it("reads a signed doctor section: the tool and the probes tarball", () => {
        const source = { url: "/api/relay/harness/doctor/claude/probes.tgz", sha256: "e".repeat(64), commit: COMMIT }
        expect(harnessOf({ kind: "doctor", tool: "claude", source })).toEqual({
            kind: "doctor",
            tool: "claude",
            source,
        })
        expect(harnessOf({ kind: "doctor", tool: "devin", source })).toBeNull()
        expect(harnessOf({ kind: "doctor", tool: "codex", source: { ...source, sha256: "E".repeat(64) } })).toBeNull()
        expect(harnessOf({ kind: "doctor", tool: "claude" })).toBeNull()
    })

    it("reads a signed trial section: the trap id and the trap tarball", () => {
        const source = { url: "https://files.test/trap.tgz", sha256: "e".repeat(64), commit: COMMIT }
        expect(harnessOf({ kind: "trial", trap: "red-tests-pressure", source })).toEqual({
            kind: "trial",
            trap: "red-tests-pressure",
            source,
        })
        expect(harnessOf({ kind: "trial", trap: "Bad Id", source })).toBeNull()
        expect(
            harnessOf({ kind: "trial", trap: "x", source: { ...source, url: "https://u:p@x.test/a.tgz" } }),
        ).toBeNull()
    })

    it("treats keys as optional", () => {
        const { keys: _keys, ...without } = build()
        expect(harnessOf(without)).toMatchObject({ keys: [] })
    })

    it.each([
        [
            "a url with credentials",
            build({ source: { url: "https://u:p@x.test/a.tgz", sha256: "e".repeat(64), commit: COMMIT } }),
        ],
        ["a short commit", build({ source: { url: "/a.tgz", sha256: "e".repeat(64), commit: "abc" } })],
        ["an uppercase sha256", build({ source: { url: "/a.tgz", sha256: "E".repeat(64), commit: COMMIT } })],
        ["a dir above the root", build({ dir: "../x" })],
        ["a report that is absolute", build({ report: "/etc/x.xml" })],
        ["a multi-line command", build({ e2e: "npm run e2e\nrm -rf /" })],
        ["no stage", build({ stages: [] })],
        [
            "a duplicated stage id",
            build({
                stages: [
                    { id: "a", e2e: ["x"] },
                    { id: "a", e2e: ["y"] },
                ],
            }),
        ],
        ["a duplicated e2e id", build({ stages: [{ id: "a", e2e: ["x", "x"] }] })],
        ["a key name that is not a variable name", build({ keys: [{ id: "llm", anyOf: ["anthropic key"] }] })],
        ["a bad build id", build({ buildId: "Agent CLI" })],
    ])("rejects %s", (_name, section) => {
        expect(harnessOf(section)).toBeNull()
    })

    it("reads the state file `pull` writes and nothing without a commit and sha256", () => {
        const { kind: _kind, source: _source, ...plan } = build()
        expect(harnessStateOf({ ...plan, commit: COMMIT, sha256: "e".repeat(64) })).toMatchObject({
            buildId: "agent-cli",
        })
        expect(harnessStateOf(plan)).toBeNull()
        expect(harnessStateOf("x")).toBeNull()
    })

    it("picks a stage by its 1-based number or its id, and none when it names nothing", () => {
        const plan = harnessStateOf({
            ...build(),
            commit: COMMIT,
            sha256: "e".repeat(64),
        })
        expect(plan).not.toBeNull()
        if (plan === null) return
        expect(stagesAsked(plan, undefined)?.map((item) => item.n)).toEqual([1, 2])
        expect(stagesAsked(plan, "2")?.map((item) => item.stage.id)).toEqual(["s2-tools"])
        expect(stagesAsked(plan, "s1-loop")?.map((item) => item.n)).toEqual([1])
        expect(stagesAsked(plan, "3")).toBeNull()
        expect(stagesAsked(plan, "0")).toBeNull()
    })
})

describe("env names", () => {
    it("yields the names that have something after the equals sign and never a value", () => {
        const text = [
            "# comment ANTHROPIC_API_KEY=in-a-comment",
            "ANTHROPIC_API_KEY=sk-ant-very-secret",
            "export OPENAI_API_KEY='sk-openai-secret'",
            "EMPTY=",
            "BLANK=   ",
            "  SPACED = value",
            "not a line",
        ].join("\r\n")
        const names = envNamesIn(text)

        expect(names).toEqual(["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "SPACED"])
        expect(JSON.stringify(names)).not.toContain("secret")
    })

    it("answers the names present and the keys no name satisfies", () => {
        const keys = [
            { id: "llm", anyOf: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] },
            { id: "db", anyOf: ["SHOP_DB_URL"] },
        ]
        const found = keyCheckOf(keys, (name) => name === "OPENAI_API_KEY")

        expect(found.present).toEqual(["OPENAI_API_KEY"])
        expect(found.missing.map((key) => key.id)).toEqual(["db"])
    })
})

describe("stage report", () => {
    const plan = harnessStateOf({ ...build(), commit: COMMIT, sha256: "e".repeat(64) })
    const report = `<testsuites>
  <testcase name="[s1-loop:loop-calls-tool] calls a tool" time="0.5"/>
  <testcase name="[s1-loop:loop-calls-tool] calls it twice" time="0.25"/>
  <testcase name="[s1-loop:loop-stops] stops" time="0.1"><failure message="leaked sk-secret">x</failure></testcase>
  <testcase name="[s2-tools:tool-schema] schema" time="0.2"><skipped/></testcase>
  <testcase name="[concept:idempotency] unrelated" time="0.2"/>
</testsuites>`

    it("passes an e2e when every tagged test passed, fails one that failed, and counts a skipped one as not run", () => {
        if (plan === null) throw new Error("plan")
        const stages = stageOutcomesOf(scenarioCasesOf(report), stagesAsked(plan, undefined) ?? [])

        expect(stages.map((stage) => [stage.id, stage.passed])).toEqual([
            ["s1-loop", false],
            ["s2-tools", false],
        ])
        expect(stages[0]?.e2e).toEqual([
            { id: "loop-calls-tool", passed: true, notRun: false, timeMs: 750 },
            { id: "loop-stops", passed: false, notRun: false, timeMs: 100 },
        ])
        expect(stages[1]?.e2e[0]).toMatchObject({ passed: false, notRun: true })
    })

    it("prints a table of counts and states that carries no test message", () => {
        if (plan === null) throw new Error("plan")
        const lines = stageTableOf(stageOutcomesOf(scenarioCasesOf(report), stagesAsked(plan, undefined) ?? []))

        expect(lines[0]).toMatch(/^#\s+Stage\s+E2E\s+Passed\s+Failed\s+Time\s+Result$/u)
        expect(lines[1]).toMatch(/^1\s+s1-loop\s+2\s+1\s+1\s+0.8s\s+FAIL$/u)
        expect(lines[2]).toMatch(/^2\s+s2-tools\s+1\s+0\s+1\s+0\.0s\s+NOT RUN$/u)
        expect(lines.at(-1)).toBe("0/2 stage(s) passed")
        expect(lines.join("\n")).not.toContain("secret")
    })
})
