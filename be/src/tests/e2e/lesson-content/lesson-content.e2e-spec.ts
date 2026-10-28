import childProcess from "node:child_process"
import { ImportLessonsCli } from "../../../features/cli/lessons/subs/import.cli"
import { AppModule as CliApp } from "../../../../apps/cli/src/app.module"
import { ACADEMY_FIXTURE_DIR, CONTENT_ID, readManifest, VERSION } from "../../fixtures/lessons/academy-fixture"
import { cliOptionsOf } from "../../world/test-apps.options"
import { useTestWorld } from "../../world/use-test-world"

const CHILD_PROCESS_ENTRIES = ["exec", "execFile", "execFileSync", "execSync", "fork", "spawn", "spawnSync"] as const

interface StoredVersion {
    readonly content_id: string
    readonly version: string
    readonly source_hash: string
    readonly created_at: string
}

/**
 * lessons import: the real cli app composition over the migrated primary database, running its `lessons import --fixture`
 * command against the committed Academy snapshot.
 */
describe("lessons import: the cli command publishes the Academy snapshot (e2e)", () => {
    const world = useTestWorld({ modules: [(w) => CliApp.register(cliOptionsOf(w))] })

    const stdout: Array<string> = []

    const importCommand = (): ImportLessonsCli => world.resolve(ImportLessonsCli)

    const runImport = async (): Promise<Record<string, unknown>> => {
        stdout.length = 0
        const command = importCommand()
        await command.run([], { fixture: command.parseFixture(ACADEMY_FIXTURE_DIR) })
        const lines = stdout
            .join("")
            .split("\n")
            .filter((line) => line.includes("lessons.imported"))
        expect(lines).toHaveLength(1)
        return JSON.parse(lines[0] ?? "{}") as Record<string, unknown>
    }

    const storedVersions = (): Promise<Array<StoredVersion>> =>
        world.db.primary.query(
            "SELECT content_id, version, source_hash, created_at::text AS created_at FROM lesson_content_versions",
        )

    const writes = jest.spyOn(process.stdout, "write")
    const spawned = CHILD_PROCESS_ENTRIES.map((entry) => jest.spyOn(childProcess, entry))

    beforeEach(() => {
        writes.mockImplementation((chunk: string | Uint8Array): boolean => {
            stdout.push(String(chunk))
            return true
        })
    })

    afterAll(() => {
        writes.mockRestore()
        for (const spy of spawned) spy.mockRestore()
    })

    it("publishes the snapshot and reports its safe counts, version and source hash, never a file body or answer key", async () => {
        const manifest = await readManifest()

        const report = await runImport()
        const rows = await storedVersions()

        expect(report).toMatchObject({
            event: "lessons.imported",
            level: "info",
            contentId: CONTENT_ID,
            version: VERSION,
            status: "published",
            variants: 8,
            locales: 2,
            challenges: 4,
            protectedInterviewItems: 24,
        })
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({ content_id: CONTENT_ID, version: VERSION, source_hash: report["sourceHash"] })
        expect(report["sourceHash"]).toMatch(/^[0-9a-f]{64}$/)
        expect(Object.keys(report).sort()).toEqual([
            "challenges",
            "contentId",
            "event",
            "level",
            "locales",
            "protectedInterviewItems",
            "sourceHash",
            "status",
            "time",
            "variants",
            "version",
        ])
        expect(manifest.files.length).toBeGreaterThan(0)
        expect(stdout.join("")).not.toContain(manifest.files[0]?.sha256 ?? "")
    })

    it("never executes the demo commands its source bodies contain", async () => {
        for (const spy of spawned) spy.mockClear()

        await runImport()

        for (const spy of spawned) expect(spy).not.toHaveBeenCalled()
    })

    it("changes nothing on a second run: the version is unchanged and its stored row is untouched", async () => {
        const before = await storedVersions()

        const report = await runImport()
        const after = await storedVersions()

        expect(report).toMatchObject({ status: "unchanged", contentId: CONTENT_ID, version: VERSION })
        expect(after).toEqual(before)
        expect(after).toHaveLength(1)
    })
})
