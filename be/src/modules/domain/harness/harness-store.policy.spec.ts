import { Test } from "@nestjs/testing"
import { harnessRawFiles } from "@tests/fixtures/builders/harness.builder"
import { convertRawHarness } from "./harness-raw.policy"
import { storeItemsOf } from "./harness-store.policy"

const POLICY = Symbol("harness-store-policy")

const policies = { storeItemsOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("storeItemsOf", () => {
    it("makes one item per record: build, guide, doc, probe, doctor pack and trap", async () => {
        const { storeItemsOf: items } = await build()

        const stored = items(convertRawHarness(harnessRawFiles()))

        expect(stored.map((item) => `${item.kind}:${item.key}`)).toEqual([
            "build:agent-cli",
            "guide:claude/claude-md",
            "doc:overview",
            "probe:claude/claude-md-present",
            "doctor-pack:claude",
            "trap:red-tests-pressure",
        ])
    })

    it("packs the files a learner pulls and keeps their text and every hidden path out of the stored record", async () => {
        const { storeItemsOf: items } = await build()

        const stored = items(convertRawHarness(harnessRawFiles()))
        const buildItem = stored.find((item) => item.kind === "build")
        const trap = stored.find((item) => item.kind === "trap")
        const guide = stored.find((item) => item.kind === "guide")

        expect(buildItem?.packFiles?.map((file) => file.path)).toEqual(["e2e/loop.e2e.ts", "source/package.json"])
        expect(buildItem?.content["packPaths"]).toEqual(["e2e/loop.e2e.ts", "source/package.json"])
        expect(JSON.stringify(buildItem?.content)).not.toContain("hidden/")
        expect(JSON.stringify(buildItem?.content)).not.toContain("export {}")
        expect(trap?.packFiles?.map((file) => file.path)).toContain("trap.yaml")
        expect(trap?.content["paths"]).toEqual(trap?.packFiles?.map((file) => file.path))
        expect(guide?.packFiles).toBeNull()
    })

    it("hashes a probe by its yaml so an edited probe is a new version", async () => {
        const { storeItemsOf: items } = await build()
        const edited = harnessRawFiles().map((file) =>
            file.path.endsWith("claude-md-present.yaml") ? { ...file, text: `${file.text}# edit\n` } : file,
        )

        const before = items(convertRawHarness(harnessRawFiles())).find((item) => item.kind === "probe")
        const after = items(convertRawHarness(edited)).find((item) => item.kind === "probe")

        expect(before?.hash).toMatch(/^[0-9a-f]{64}$/u)
        expect(after?.hash).not.toBe(before?.hash)
    })
})
