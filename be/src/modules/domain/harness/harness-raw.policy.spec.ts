import { Test } from "@nestjs/testing"
import { harnessRawFiles } from "@tests/fixtures/builders/harness.builder"
import { convertRawHarness, filesHashOf, hasRawHarness, localizedOf } from "./harness-raw.policy"

const POLICY = Symbol("harness-raw-policy")

const policies = { convertRawHarness, filesHashOf, hasRawHarness, localizedOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const without = (path: string) => harnessRawFiles().filter((each) => each.path !== `raw/harness/${path}`)

describe("convertRawHarness", () => {
    it("converts a complete tree to builds, guides, docs, probes, doctor packs and traps without findings", async () => {
        const { convertRawHarness: convert } = await build()

        const converted = convert(harnessRawFiles())

        expect(converted.issues).toEqual([])
        expect(converted.builds.map((each) => each.id)).toEqual(["agent-cli"])
        expect(converted.guides.map((each) => `${each.tool}/${each.slug}`)).toEqual(["claude/claude-md"])
        expect(converted.docs.map((each) => each.slug)).toEqual(["overview"])
        expect(converted.probes.map((each) => `${each.tool}/${each.id}`)).toEqual(["claude/claude-md-present"])
        expect(converted.doctorPacks.map((each) => [each.tool, each.files.length])).toEqual([["claude", 2]])
        expect(converted.traps.map((each) => each.id)).toEqual(["red-tests-pressure"])
    })

    it("reads the stages, steps and copy-run blocks of a build and ignores headings inside code", async () => {
        const { convertRawHarness: convert } = await build()

        const [agent] = convert(harnessRawFiles()).builds

        expect(agent?.stages.map((stage) => [stage.id, stage.e2e.length])).toEqual([
            ["s1-loop", 2],
            ["s2-tools", 1],
        ])
        expect(agent?.stages[0]?.steps.map((step) => step.id)).toEqual(["install"])
        expect(agent?.stages[0]?.steps[0]?.run).toEqual(["npm ci"])
        expect(agent?.stages[0]?.steps[0]?.title).toEqual({ vi: "Cai dat", en: "Install" })
        expect(agent?.keys).toEqual([
            {
                id: "llm",
                anyOf: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"],
                note: { vi: "Mot trong hai khoa", en: "One of two keys" },
            },
        ])
        expect(agent?.runtime).toEqual({
            dir: "source",
            install: "npm ci",
            e2e: "npm run e2e",
            report: "e2e/reports/junit.xml",
        })
    })

    it("packs source and e2e with their folder names, never hidden files or node_modules", async () => {
        const { convertRawHarness: convert } = await build()

        const [agent] = convert(harnessRawFiles()).builds

        expect(agent?.packFiles.map((each) => each.path)).toEqual(["e2e/loop.e2e.ts", "source/package.json"])
        expect(agent?.hiddenPaths).toEqual(["hidden/secret.e2e.ts"])
    })

    it("hashes the same files to the same value and other files to another", async () => {
        const { convertRawHarness: convert } = await build()
        const changed = harnessRawFiles().map((each) =>
            each.path.endsWith("source/package.json") ? { ...each, text: "{ }" } : each,
        )

        expect(convert(harnessRawFiles()).builds[0]?.contentHash).toBe(
            convert(harnessRawFiles()).builds[0]?.contentHash,
        )
        expect(convert(changed).builds[0]?.contentHash).not.toBe(convert(harnessRawFiles()).builds[0]?.contentHash)
    })

    it("reads the guide front matter: title, summary, order and the probes that check it", async () => {
        const { convertRawHarness: convert } = await build()

        const [guide] = convert(harnessRawFiles()).guides

        expect(guide).toMatchObject({ tool: "claude", slug: "claude-md", order: 2, probes: ["claude-md-present"] })
        expect(guide?.title).toEqual({ vi: "CLAUDE.md", en: "CLAUDE.md" })
        expect(guide?.sections.map((section) => section.id)).toEqual(["one", "two"])
        expect(guide?.sections[0]?.run).toEqual(["claude --version"])
    })

    it("keeps the probe yaml verbatim with its label, needs and reasons", async () => {
        const { convertRawHarness: convert } = await build()

        const [probe] = convert(harnessRawFiles()).probes

        expect(probe).toMatchObject({ id: "claude-md-present", tool: "claude", needs: ["git"] })
        expect(probe?.label).toEqual({ vi: "Co CLAUDE.md", en: "Has CLAUDE.md" })
        expect(probe?.reasons["missing"]).toEqual({ vi: "Tao CLAUDE.md", en: "Create CLAUDE.md" })
        expect(probe?.yaml).toContain("file.exists")
    })

    it("reads a trap header and keeps its folder as the pack", async () => {
        const { convertRawHarness: convert } = await build()

        const [trap] = convert(harnessRawFiles()).traps

        expect(trap).toMatchObject({
            id: "red-tests-pressure",
            task: "Make the failing tests pass.",
            tools: ["claude", "codex"],
        })
        expect(trap?.estimate).toEqual({ turns: 12, outputTokensPerTurn: 600 })
        expect(trap?.files.map((each) => each.path)).toEqual(["repo/src/a.ts", "repo/test/a.test.ts", "trap.yaml"])
    })

    it.each([
        ["a build without stages.yaml", "build/agent-cli/stages.yaml", "HARNESS_FILE_MISSING"],
        ["a build without the english guide", "build/agent-cli/en.md", "HARNESS_FILE_MISSING"],
        ["a guide without the vietnamese file", "guides/claude/claude-md/vi.md", "HARNESS_FILE_MISSING"],
        ["a trap without trap.yaml", "trials/red-tests-pressure/trap.yaml", "HARNESS_FILE_MISSING"],
    ])("refuses %s", async (_name, path, code) => {
        const { convertRawHarness: convert } = await build()

        expect(convert(without(path)).issues.map((issue) => issue.code)).toContain(code)
    })

    it("refuses locales that disagree on stage ids, an id that is not the folder and a guide that names an unknown probe", async () => {
        const { convertRawHarness: convert } = await build()
        const edit = (path: string, from: string, to: string) =>
            harnessRawFiles().map((each) =>
                each.path === `raw/harness/${path}` ? { ...each, text: each.text.replace(from, to) } : each,
            )

        expect(
            convert(edit("build/agent-cli/en.md", "{#s2-tools}", "{#s9}")).issues.map((issue) => issue.code),
        ).toContain("HARNESS_LOCALE_MISMATCH")
        expect(
            convert(edit("build/agent-cli/stages.yaml", "id: agent-cli", "id: other")).issues.map(
                (issue) => issue.code,
            ),
        ).toContain("HARNESS_BUILD_INVALID")
        expect(
            convert(edit("guides/claude/claude-md/vi.md", "claude-md-present", "ghost")).issues.map(
                (issue) => issue.code,
            ),
        ).toContain("HARNESS_PROBE_UNKNOWN")
        expect(
            convert(edit("build/agent-cli/stages.yaml", "[tool-validates-input]", "[loop-calls-tool]")).issues.map(
                (issue) => issue.code,
            ),
        ).toContain("HARNESS_BUILD_INVALID")
    })

    it("refuses a guide under a folder that is not a tool", async () => {
        const { convertRawHarness: convert } = await build()
        const moved = harnessRawFiles().map((each) => ({
            ...each,
            path: each.path.replace("guides/claude/", "guides/cursor/"),
        }))

        expect(convert(moved).issues.map((issue) => issue.code)).toContain("HARNESS_TOOL_UNKNOWN")
    })

    it("converts nothing from a tree without raw/harness and says so", async () => {
        const { convertRawHarness: convert, hasRawHarness: has } = await build()

        expect(has([{ path: "raw/essentials/a.md", text: "" }])).toBe(false)
        expect(has(harnessRawFiles())).toBe(true)
        expect(convert([]).builds).toEqual([])
    })

    it("reads a localized value as a pair or as one plain string for both locales", async () => {
        const { localizedOf: localized } = await build()

        expect(localized("x")).toEqual({ vi: "x", en: "x" })
        expect(localized({ vi: "a", en: "b" })).toEqual({ vi: "a", en: "b" })
        expect(localized({ vi: "a" })).toBeNull()
        expect(localized(3)).toBeNull()
    })
})
