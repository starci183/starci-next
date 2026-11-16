import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { CLAUDE_PROBE_YAML, CODEX_PROBES, harnessWorld, putFile, writeProbes, type HarnessWorld } from "./harness.testing"
import { doctorCommand } from "./harness-doctor.cli"
import type { DoctorOptions } from "./harness-trial.contracts"
import { readQueue } from "./upload-queue.adapter"

/** Each case runs real git and node processes; a loaded machine needs more than the default 5 seconds. */
jest.setTimeout(60_000)

const OPTIONS: DoctorOptions = { yes: true, json: false, noUpload: false }

let world: HarnessWorld

beforeEach(() => {
    world = harnessWorld()
    writeProbes(world.data, "claude-code", { "claude-md-present.yaml": CLAUDE_PROBE_YAML })
    writeProbes(world.data, "codex", CODEX_PROBES)
})

const doctor = (options: Partial<DoctorOptions> = {}) => doctorCommand(world.io, { ...OPTIONS, from: world.data, ...options }, world.cwd)
const text = (): string => world.out.join("\n")

describe("harness doctor", () => {
    it("runs the probes of one tool against the project and the home folder, prints a line per probe and fails when one fails", async () => {
        putFile(world.cwd, "CLAUDE.md", "# rules")

        const passing = await doctor({ tool: "claude" })
        expect(passing).toBe(0)
        expect(text()).toContain("claude-md-present  CLAUDE.md is present")
        expect(text()).toContain("claude: 1 passed, 0 failed, 0 skipped, 0 invalid.")

        world.out.length = 0
        putFile(world.cwd, "CLAUDE.md", "x")
        const failing = await doctor({ tool: "claude" })
        expect(failing).toBe(1)
        expect(text()).toMatch(/failed\s+claude-md-present/u)
        expect(text()).toContain("file found but its content is too small")
        expect(text()).toContain("Fix: Create a CLAUDE.md")
    })

    it("prints the labels and fixes in Vietnamese on request, and reads the home folder of the learner", async () => {
        putFile(world.home, ".codex/config.toml", 'approval_policy = "never"\n')

        await doctor({ tool: "codex", lang: "vi" })

        expect(text()).toMatch(/failed\s+approval-policy-set\s+approval/u)
        expect(text()).toContain("Fix: Đặt approval_policy")
        expect(text()).toContain("approval_policy is not one of untrusted, on-request")
    })

    it("shows every command first and asks, runs nothing on a no, and runs them on --yes", async () => {
        const declined = harnessWorld({ confirm: false })
        writeProbes(declined.data, "codex", CODEX_PROBES)

        const code = await doctorCommand(declined.io, { ...OPTIONS, yes: false, tool: "codex", from: declined.data }, declined.cwd)

        expect(code).toBe(1)
        expect(declined.out.join("\n")).toContain("  node -e process.exit(0)")
        expect(declined.asked).toEqual(["Run them?"])
        expect(declined.out.join("\n")).toContain("Nothing was run.")
        expect(declined.sent).toHaveLength(0)

        expect(await doctor({ tool: "codex" })).toBe(1)
        expect(text()).toMatch(/passed\s+node-runs/u)
        expect(world.asked).toEqual([])
    })

    it("marks a probe file that does not parse as invalid with where, and still runs the others", async () => {
        const code = await doctor({ tool: "codex" })

        expect(code).toBe(1)
        expect(text()).toMatch(/invalid\s+two-checks/u)
        expect(text()).toContain("check must hold exactly one of file, json, toml, env, command, hook, git")
        expect(text()).toMatch(/passed\s+node-runs/u)
        expect(text()).toMatch(/failed\s+approval-policy-set/u)
    })

    it("runs both tools when none is named, and prints one JSON result per tool with --json", async () => {
        putFile(world.cwd, "CLAUDE.md", "# rules")

        await doctor({ json: true })

        const results = world.out.map((line) => JSON.parse(line) as { kind: string; tool: string; probes: Array<{ id: string; status: string }>; summary: Record<string, number> })
        expect(results.map((result) => result.tool)).toEqual(["claude", "codex"])
        expect(results[0]).toMatchObject({ kind: "harness-doctor", probes: [{ id: "claude-md-present", status: "passed" }], summary: { passed: 1, failed: 0, skipped: 0, invalid: 0 } })
        expect(results[1]?.summary).toEqual({ passed: 1, failed: 1, skipped: 0, invalid: 1 })
        expect(world.err.join("\n")).toContain("The probes will run these on this machine:")
    })

    it("sends one result per probe (id, status, reason) and nothing from the machine, and queues them offline", async () => {
        putFile(world.cwd, "CLAUDE.md", "# rules")
        await doctor({ tool: "claude" })

        expect(world.sent[0]?.query).toContain("relayHarnessResult")
        expect(world.sent.map((body) => body.variables.input)).toEqual([
            { eventId: expect.any(String), kind: "harness-doctor", tool: "claude", probe: "claude-md-present", status: "passed" },
        ])

        const offline = harnessWorld({ fetchStatus: 0 })
        writeProbes(offline.data, "claude-code", { "claude-md-present.yaml": CLAUDE_PROBE_YAML })
        await doctorCommand(offline.io, { ...OPTIONS, tool: "claude", from: offline.data }, offline.cwd)
        expect(readQueue(offline.io.env)).toHaveLength(1)
        expect(JSON.stringify(readQueue(offline.io.env))).toContain("check-failed")
    })

    it("does not send with --no-upload, and tells an unpaired machine the result stays here", async () => {
        await doctor({ tool: "claude", noUpload: true })
        expect(world.sent).toHaveLength(0)

        const unpaired = harnessWorld({ paired: false })
        writeProbes(unpaired.data, "claude-code", { "claude-md-present.yaml": CLAUDE_PROBE_YAML })
        await doctorCommand(unpaired.io, { ...OPTIONS, tool: "claude", from: unpaired.data }, unpaired.cwd)
        expect(unpaired.err.join("\n")).toContain("Not paired")
    })

    it("refuses an unknown tool, a missing source and a content with no probes", async () => {
        expect(await doctor({ tool: "devin" })).toBe(1)
        expect(world.err.join("\n")).toContain("Unknown tool devin")

        const bare = harnessWorld({ paired: false })
        expect(await doctorCommand(bare.io, { ...OPTIONS }, bare.cwd)).toBe(1)
        expect(bare.err.join("\n")).toContain("--from")

        const empty = harnessWorld()
        expect(await doctorCommand(empty.io, { ...OPTIONS, from: empty.data }, empty.cwd)).toBe(1)
        expect(empty.err.join("\n")).toContain("No doctor probes found.")
    })
})

describe("harness doctor with the probes of the content repository", () => {
    const FIXTURES = join(__dirname, "..", "..", "platform", "check-flow-local", "fixtures", "doctor")

    it("reads all fourteen files as valid probes, none invalid", async () => {
        const real = harnessWorld()
        readdirSync(FIXTURES).forEach((folder) => {
            const probes = Object.fromEntries(readdirSync(join(FIXTURES, folder)).map((file) => [file, readFileSync(join(FIXTURES, folder, file), "utf8")]))
            writeProbes(real.data, folder, probes)
        })

        await doctorCommand(real.io, { ...OPTIONS, from: real.data, noUpload: true, json: true }, real.cwd)

        const results = real.out.map((line) => JSON.parse(line) as { tool: string; probes: Array<unknown>; summary: { invalid: number } })
        expect(results.map((result) => [result.tool, result.probes.length, result.summary.invalid])).toEqual([["claude", 8, 0], ["codex", 6, 0]])
    })
})
