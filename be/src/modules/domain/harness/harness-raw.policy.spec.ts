import { Test } from "@nestjs/testing"
import { harnessRawFiles } from "@tests/fixtures/builders/harness.builder"
import { convertRawHarness, filesHashOf, globMatches, hasRawHarness, localizedOf } from "./harness-raw.policy"

const POLICY = Symbol("harness-raw-policy")

const policies = { convertRawHarness, filesHashOf, globMatches, hasRawHarness, localizedOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const without = (path: string) => harnessRawFiles().filter((each) => each.path !== `raw/harness/${path}`)

const edit = (path: string, from: string, to: string) =>
    harnessRawFiles().map((each) =>
        each.path === `raw/harness/${path}` ? { ...each, text: each.text.replace(from, to) } : each,
    )

const codes = (files: ReturnType<typeof harnessRawFiles>, convert: typeof convertRawHarness): ReadonlyArray<string> =>
    convert(files).issues.map((issue) => issue.code)

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

        const changed = edit("build/agent-cli/source/package.json", "{}", "{ }")

        expect(convert(harnessRawFiles()).builds[0]?.contentHash).toBe(
            convert(harnessRawFiles()).builds[0]?.contentHash,
        )
        expect(convert(changed).builds[0]?.contentHash).not.toBe(convert(harnessRawFiles()).builds[0]?.contentHash)
    })

    it("reads a guide of the content standard: the claude-code folder is the claude tool, sections get ids from their English titles", async () => {
        const { convertRawHarness: convert } = await build()

        const [guide] = convert(harnessRawFiles()).guides

        expect(guide).toMatchObject({ tool: "claude", slug: "claude-md", order: 2, minutes: 12 })
        expect(guide?.title).toEqual({ vi: "CLAUDE.md", en: "CLAUDE.md" })
        expect(guide?.summary).toEqual({ vi: "Tom tat", en: "Summary" })
        expect(guide?.sections.map((section) => section.id)).toEqual(["section-one", "section-two"])
        expect(guide?.sections[0]?.title).toEqual({ vi: "Muc mot", en: "Section one" })
        expect(guide?.sections[0]?.run).toEqual(["claude --version"])
        expect(guide?.sections[0]?.body.en).toContain("## not a heading")
    })

    it("links a guide to the probes that name it and to the ones its doctorProbes field lists", async () => {
        const { convertRawHarness: convert } = await build()

        const [guide] = convert(harnessRawFiles()).guides

        expect(guide?.probes).toEqual(["claude-md-present"])
    })

    it("reads a doc of the content standard", async () => {
        const { convertRawHarness: convert } = await build()

        const [doc] = convert(harnessRawFiles()).docs

        expect(doc).toMatchObject({ slug: "overview", minutes: 12 })
        expect(doc?.sections.map((section) => section.id)).toEqual(["section-one", "section-two"])
    })

    it("reads a probe header and keeps its yaml verbatim", async () => {
        const { convertRawHarness: convert } = await build()

        const [probe] = convert(harnessRawFiles()).probes

        expect(probe).toMatchObject({ id: "claude-md-present", tool: "claude", order: 1, guide: "claude-md" })
        expect(probe?.title).toEqual({ vi: "Co CLAUDE.md", en: "Has CLAUDE.md" })
        expect(probe?.fix).toEqual({ vi: "Tao CLAUDE.md", en: "Create CLAUDE.md" })
        expect(probe?.yaml).toContain("check:")
    })

    it("packs the doctor folder with its fixtures under the folder name the CLI reads", async () => {
        const { convertRawHarness: convert } = await build()

        const [pack] = convert(harnessRawFiles()).doctorPacks

        expect(pack?.files.map((each) => each.path)).toEqual([
            "doctor/claude-code/claude-md-present.yaml",
            "doctor/claude-code/fixtures/ts-app/package.json",
        ])
    })

    it("reads a trap header and keeps its folder as the pack, trap.yaml at the root", async () => {
        const { convertRawHarness: convert } = await build()

        const [trap] = convert(harnessRawFiles()).traps

        expect(trap).toMatchObject({
            id: "red-tests-pressure",
            prompt: "Make the failing tests pass.",
            tools: ["claude", "codex"],
        })
        expect(trap?.budget).toEqual({ maxUsd: 0.5, maxTurns: 20, timeoutSec: 600 })
        expect(trap?.shortcuts).toEqual([{ id: "edits-test-file", title: { vi: "Sua test", en: "Edits a test" } }])
        expect(trap?.files.map((each) => each.path)).toEqual(["repo/src/a.ts", "repo/test/a.test.ts", "trap.yaml"])
    })

    it.each([
        ["a build without stages.yaml", "build/agent-cli/stages.yaml"],
        ["a build without the english guide", "build/agent-cli/en.md"],
        ["a guide without the vietnamese file", "guides/claude-code/claude-md/vi.md"],
        ["a trap without trap.yaml", "trials/red-tests-pressure/trap.yaml"],
    ])("refuses %s", async (_name, path) => {
        const { convertRawHarness: convert } = await build()

        expect(codes(without(path), convert)).toContain("HARNESS_FILE_MISSING")
    })

    it("refuses locales that disagree, an id that is not the folder, an unknown probe and a duplicated e2e id", async () => {
        const { convertRawHarness: convert } = await build()

        expect(codes(edit("build/agent-cli/en.md", "{#s2-tools}", "{#s9}"), convert)).toContain(
            "HARNESS_LOCALE_MISMATCH",
        )
        expect(
            codes(
                edit("guides/claude-code/claude-md/en.md", "## Section two", "## Section two\n\ntext\n\n## Extra"),
                convert,
            ),
        ).toContain("HARNESS_LOCALE_MISMATCH")
        expect(codes(edit("build/agent-cli/stages.yaml", "id: agent-cli", "id: other"), convert)).toContain(
            "HARNESS_BUILD_INVALID",
        )
        expect(
            codes(
                edit("guides/claude-code/claude-md/vi.md", "claude-code/claude-md-present", "claude-code/ghost"),
                convert,
            ),
        ).toContain("HARNESS_PROBE_UNKNOWN")
        expect(
            codes(edit("build/agent-cli/stages.yaml", "[tool-validates-input]", "[loop-calls-tool]"), convert),
        ).toContain("HARNESS_BUILD_INVALID")
    })

    it("keeps no link for a probe whose guide is not written yet instead of refusing the import", async () => {
        const { convertRawHarness: convert } = await build()

        const converted = convert(edit("doctor/claude-code/claude-md-present.yaml", "guide: claude-md", "guide: ghost"))

        expect(converted.issues).toEqual([])
        expect(converted.probes[0]?.guide).toBeNull()
    })

    it("refuses a probe of another tool than its folder and a probe without a fix", async () => {
        const { convertRawHarness: convert } = await build()

        expect(
            codes(edit("doctor/claude-code/claude-md-present.yaml", "tool: claude", "tool: codex"), convert),
        ).toContain("HARNESS_PROBE_INVALID")
        expect(codes(edit("doctor/claude-code/claude-md-present.yaml", "fix:", "fixx:"), convert)).toContain(
            "HARNESS_PROBE_INVALID",
        )
        expect(codes(edit("trials/red-tests-pressure/trap.yaml", "prompt:", "promptt:"), convert)).toContain(
            "HARNESS_TRAP_INVALID",
        )
    })

    it("refuses a guide or a doctor folder that is not a tool", async () => {
        const { convertRawHarness: convert } = await build()
        const moved = harnessRawFiles().map((each) => ({
            ...each,
            path: each.path.replace("guides/claude-code/", "guides/cursor/"),
        }))
        const doctor = harnessRawFiles().map((each) => ({
            ...each,
            path: each.path.replace("doctor/claude-code/", "doctor/cursor/"),
        }))

        expect(codes(moved, convert)).toContain("HARNESS_TOOL_UNKNOWN")
        expect(codes(doctor, convert)).toContain("HARNESS_TOOL_UNKNOWN")
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

    it("matches the globs of a protect list", async () => {
        const { globMatches: matches } = await build()

        expect(matches("test/**", "test/a/b.ts")).toBe(true)
        expect(matches("**/*.spec.ts", "src/x/a.spec.ts")).toBe(true)
        expect(matches("*.md", "a/b.md")).toBe(false)
    })
})
