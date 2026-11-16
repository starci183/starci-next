import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parse } from "yaml"
import { flowOfMarkdown, flowOfYaml } from "./check-flow-document.policy"
import { fixturesOf, runAgainstFakeApp } from "./check-flow-fixture.testing"

/**
 * The fixtures of every probe and every e2e flow, run against the fake learner app: each flow must pass on the good app, and stay
 * unproved (fail with the reason its fixture names) on every cheat app, whose behaviour is wrong although a learner's own tests could
 * be green. The flows are data: by default the copy in tests/fixtures/project-checks, or a content checkout named by
 * STARCI_NEXT_DATA_DIR (its raw/projects). Adding a probe adds its cases here with no test code.
 */
const dataDir = process.env["STARCI_NEXT_DATA_DIR"]
const root =
    dataDir === undefined
        ? join(__dirname, "..", "..", "..", "tests", "fixtures", "project-checks")
        : join(dataDir, "raw", "projects")
const probeDir = join(root, "probes")
const e2eDir = dataDir === undefined ? join(root, "e2e") : join(root, "kit", "starci", "e2e")

interface Case {
    readonly name: string
    readonly text: string
    readonly kind: "probe" | "e2e"
}

const FENCE = /^```ya?ml[ \t]+starci-flow[ \t]*\r?\n([\s\S]*?)\r?\n```/mu

const cases: ReadonlyArray<Case> = [
    ...readdirSync(probeDir)
        .filter((file) => file.endsWith(".yaml"))
        .map((file) => ({ name: file, text: readFileSync(join(probeDir, file), "utf8"), kind: "probe" as const })),
    ...readdirSync(e2eDir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => ({ name: file, text: readFileSync(join(e2eDir, file), "utf8"), kind: "e2e" as const })),
]

const documentOf = (item: Case): unknown =>
    parse(item.kind === "probe" ? item.text : String(FENCE.exec(item.text)?.[1]))

describe("check-flow fixtures", () => {
    it("finds the probes and e2e flows", () => {
        expect(cases.filter((item) => item.kind === "probe").length).toBeGreaterThanOrEqual(10)
        expect(cases.filter((item) => item.kind === "e2e").length).toBeGreaterThanOrEqual(9)
    })

    describe.each(cases)("$kind $name", (item) => {
        const parsed = item.kind === "probe" ? flowOfYaml(item.text) : flowOfMarkdown(item.text)
        const fixtures = fixturesOf(documentOf(item))

        it("passes the schema", () => {
            expect(parsed.ok ? [] : parsed.issues).toEqual([])
        })

        it("passes against the good app", async () => {
            if (!parsed.ok) throw new Error("the flow does not parse")
            const verdict = await runAgainstFakeApp(parsed.flow, fixtures, {})
            expect(verdict).toMatchObject({ status: "passed", reason: parsed.flow.pass })
        })

        it.each(fixtures.cheats)("stays unproved against the cheat: $name", async (cheat) => {
            if (!parsed.ok) throw new Error("the flow does not parse")
            const verdict = await runAgainstFakeApp(parsed.flow, fixtures, cheat.app)
            expect({ status: verdict.status, reason: verdict.reason }).toEqual({
                status: "failed",
                reason: cheat.fails,
            })
        })
    })
})
