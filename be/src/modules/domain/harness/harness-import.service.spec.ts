import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import { harnessRawFiles } from "@tests/fixtures/builders/harness.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { HarnessErrorCode } from "./errors/harness.error"
import { convertRawHarness } from "./harness-raw.policy"
import { HarnessImportService } from "./harness-import.service"
import { HARNESS_SOURCE, type HarnessSourceReader } from "./harness-source.port"
import { storeItemsOf } from "./harness-store.policy"
import {
    INSERT_CONTENT,
    SELECT_PUBLISHED_ONE,
    SELECT_VERSION_HASH,
    SUPERSEDE_PUBLISHED,
} from "./persistence/harness.sql"

const NOW = new Date("2026-11-17T03:00:00.000Z")
const ITEMS = storeItemsOf(convertRawHarness(harnessRawFiles()))

type Stubs = { live?: ReadonlyArray<{ content_hash: string }>; version?: ReadonlyArray<{ content_hash: string }> }

const build = async (stubs: Stubs = {}, files = harnessRawFiles(), present = true) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PUBLISHED_ONE, [...(stubs.live ?? [])]],
            [SELECT_VERSION_HASH, [...(stubs.version ?? [])]],
            [SUPERSEDE_PUBLISHED, []],
            [INSERT_CONTENT, [{ content_key: "x" }]],
        ],
    })
    fakeTransaction(em)
    const source = mock<HarnessSourceReader>()
    source.exists.mockResolvedValue(present)
    source.read.mockResolvedValue(files)
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            HarnessImportService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: HARNESS_SOURCE, useValue: source },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(HarnessImportService), em, source }
}

describe("HarnessImportService import", () => {
    it("stores every item of a valid tree as a new live version, the packs as tarballs", async () => {
        const { service, em } = await build()

        const reports = await service.import({ directory: "/c", ref: "a".repeat(40) })

        expect(reports.map((report) => `${report.kind}:${report.key}:${report.status}`)).toEqual(
            ITEMS.map((item) => `${item.kind}:${item.key}:created`),
        )
        const inserts = em.query.mock.calls.filter(([text]) => text === INSERT_CONTENT)
        expect(inserts).toHaveLength(ITEMS.length)
        const stored = inserts.find(
            ([, params]) => (params as ReadonlyArray<unknown>)[0] === "build",
        )?.[1] as ReadonlyArray<unknown>
        expect(stored[2]).toBe("a".repeat(40))
        expect(Buffer.isBuffer(stored[6])).toBe(true)
        expect(stored[7]).toMatch(/^[0-9a-f]{64}$/u)
        expect(JSON.stringify(stored[5])).not.toContain("secret.e2e.ts")
    })

    it("leaves an item alone when its live version has the same hash", async () => {
        const hashes = new Map(ITEMS.map((item) => [`${item.kind}:${item.key}`, item.hash]))
        const { service, em } = await build({ live: [{ content_hash: [...hashes.values()][0] ?? "" }] })

        const reports = await service.import({ directory: "/c", ref: "r2" })

        expect(reports[0]?.status).toBe("unchanged")
        expect(em.query.mock.calls.filter(([text]) => text === INSERT_CONTENT)).toHaveLength(ITEMS.length - 1)
    })

    it("refuses other bytes under a stored version as HARNESS_VERSION_CONFLICT after reporting each item", async () => {
        const { service } = await build({ version: [{ content_hash: "different" }] })

        await expect(service.import({ directory: "/c", ref: "r1" })).rejects.toMatchObject({
            code: HarnessErrorCode.VersionConflict,
        })
    })

    it("refuses a tree with findings before writing anything", async () => {
        const broken = harnessRawFiles().filter((file) => !file.path.endsWith("build/agent-cli/en.md"))
        const { service, em } = await build({}, broken)

        await expect(service.import({ directory: "/c", ref: "r1" })).rejects.toMatchObject({
            code: HarnessErrorCode.ContentInvalid,
        })

        expect(em.query).not.toHaveBeenCalled()
    })

    it("refuses a missing directory or ref", async () => {
        const absent = await build({}, harnessRawFiles(), false)
        const present = await build()

        await expect(absent.service.import({ directory: "/c", ref: "r1" })).rejects.toMatchObject({
            code: HarnessErrorCode.ImportRejected,
        })
        await expect(present.service.import({ directory: "/c", ref: "" })).rejects.toMatchObject({
            code: HarnessErrorCode.ImportRejected,
        })
    })
})
