import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { practiceFilesOf } from "@tests/fixtures/builders/practice.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { PracticeErrorCode } from "./errors/practice.error"
import { buildPracticeDraft } from "./practice-draft.policy"
import { PracticeImportService } from "./practice-import.service"
import { PRACTICE_SOURCE, type PracticeSourceReader } from "./practice-source.port"
import { PracticeLogEvent } from "./practice.log-events"
import type { PracticeSourceEntry, PracticeSourceFile } from "./practice.contracts"
import { INSERT_VERSION, SELECT_VERSION_HASH, SUPERSEDE_PUBLISHED } from "./persistence/practice.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const DIRECTORY = "coding-problems"
const REF = "abc1234"
const ENTRY: PracticeSourceEntry = { pattern: "arrays", slug: "sum-two" }
const OTHER: PracticeSourceEntry = { pattern: "strings", slug: "echo" }

const build = async (
    em: MockEntityManager,
    entries: ReadonlyArray<PracticeSourceEntry>,
    files: (entry: PracticeSourceEntry) => ReadonlyArray<PracticeSourceFile>,
) => {
    const source = mock<PracticeSourceReader>()
    source.entries.mockResolvedValue(entries)
    source.read.mockImplementation((_directory, entry) => Promise.resolve(files(entry)))
    const logger = mock<Logger>()
    const transaction = fakeTransaction(em)
    const moduleRef = await Test.createTestingModule({
        providers: [
            PracticeImportService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: transaction.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: PRACTICE_SOURCE, useValue: source },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(PracticeImportService), source, logger, transaction }
}

const queriesOf = (held: ReadonlyArray<{ content_hash: string }>, inserted = [{ problem_id: "sum-two" }]) =>
    [
        [SELECT_VERSION_HASH, held],
        [SUPERSEDE_PUBLISHED, []],
        [INSERT_VERSION, inserted],
    ] as const

describe("PracticeImportService import", () => {
    it("stores a valid folder as the new live version, the tests and solutions in the row and only counts in the report", async () => {
        const em = mockEntityManager({ query: queriesOf([]) })
        const files = practiceFilesOf()
        const { service, logger, transaction } = await build(em, [ENTRY], () => files)

        const reports = await service.import({ directory: DIRECTORY, ref: REF, only: "" })

        expect(reports).toEqual([
            { folder: "arrays/sum-two", pattern: "arrays", version: REF, status: "created", tests: 2, issues: [] },
        ])
        expect(em.query).toHaveBeenCalledWith(SUPERSEDE_PUBLISHED, ["sum-two"])
        const insert = em.query.mock.calls.find((call) => call[0] === INSERT_VERSION)?.[1] ?? []
        expect(insert[0]).toBe("sum-two")
        expect(insert[1]).toBe(REF)
        expect(insert[2]).toBe(buildPracticeDraft(ENTRY, files).draft?.contentHash)
        expect(insert[16]).toEqual(NOW)
        expect(transaction.commits).toBe(1)
        expect(logger.info).toHaveBeenCalledWith(
            PracticeLogEvent.Imported,
            expect.objectContaining({ status: "created", issues: 0 }),
        )
    })

    it("leaves an identical version alone", async () => {
        const files = practiceFilesOf()
        const hash = buildPracticeDraft(ENTRY, files).draft?.contentHash ?? ""
        const em = mockEntityManager({ query: queriesOf([{ content_hash: hash }]) })
        const { service, transaction } = await build(em, [ENTRY], () => files)

        const reports = await service.import({ directory: DIRECTORY, ref: REF, only: "" })

        expect(reports[0]?.status).toBe("unchanged")
        expect(em.query).not.toHaveBeenCalledWith(INSERT_VERSION, expect.anything())
        expect(transaction.commits).toBe(0)
    })

    it("refuses other bytes under a stored version and writes nothing", async () => {
        const em = mockEntityManager({ query: queriesOf([{ content_hash: "other-bytes" }]) })
        const { service, transaction } = await build(em, [ENTRY], () => practiceFilesOf())

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toMatchObject({
            code: PracticeErrorCode.VersionImmutable,
            params: { folders: "arrays/sum-two" },
        })

        expect(em.query).not.toHaveBeenCalledWith(INSERT_VERSION, expect.anything())
        expect(transaction.commits).toBe(0)
    })
})

describe("PracticeImportService import of several folders", () => {
    it("tries every folder, then fails on the invalid one without touching the live version", async () => {
        const em = mockEntityManager({ query: queriesOf([]) })
        const { service, logger } = await build(em, [ENTRY, OTHER], (entry) =>
            entry === ENTRY ? practiceFilesOf() : practiceFilesOf({ pattern: "strings", omit: ["title"] }),
        )

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toMatchObject({
            code: PracticeErrorCode.ContentInvalid,
            params: { folders: "strings/echo" },
        })

        expect(em.query).toHaveBeenCalledWith(SUPERSEDE_PUBLISHED, ["sum-two"])
        expect(em.query).not.toHaveBeenCalledWith(SUPERSEDE_PUBLISHED, ["echo"])
        expect(logger.info).toHaveBeenCalledTimes(2)
    })

    it("names a refused folder before an invalid one", async () => {
        const em = mockEntityManager({ query: queriesOf([{ content_hash: "other-bytes" }]) })
        const { service } = await build(em, [ENTRY, OTHER], (entry) =>
            entry === ENTRY ? practiceFilesOf() : practiceFilesOf({ pattern: "strings", omit: ["title"] }),
        )

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toMatchObject({
            code: PracticeErrorCode.VersionImmutable,
        })
    })

    it("imports only the patterns named", async () => {
        const em = mockEntityManager({ query: queriesOf([]) })
        const { service, source } = await build(em, [ENTRY, OTHER], () => practiceFilesOf())

        const reports = await service.import({ directory: DIRECTORY, ref: REF, only: "arrays" })

        expect(reports.map((report) => report.pattern)).toEqual(["arrays"])
        expect(source.read).toHaveBeenCalledTimes(1)
    })

    it("refuses a pattern the directory does not hold", async () => {
        const { service } = await build(mockEntityManager({ query: queriesOf([]) }), [ENTRY], () => practiceFilesOf())

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "arrays,nope" })).rejects.toMatchObject({
            code: PracticeErrorCode.ImportRejected,
            params: { patterns: "nope" },
        })
    })

    it("refuses a blank directory or ref before reading anything", async () => {
        const { service, source } = await build(mockEntityManager({ query: queriesOf([]) }), [ENTRY], () =>
            practiceFilesOf(),
        )

        await expect(service.import({ directory: " ", ref: REF, only: "" })).rejects.toMatchObject({
            code: PracticeErrorCode.ImportRejected,
        })
        await expect(service.import({ directory: DIRECTORY, ref: "", only: "" })).rejects.toMatchObject({
            code: PracticeErrorCode.ImportRejected,
        })

        expect(source.entries).not.toHaveBeenCalled()
    })

    it("rolls back and refuses when the insert stored nothing", async () => {
        const em = mockEntityManager({ query: queriesOf([], []) })
        const { service, transaction } = await build(em, [ENTRY], () => practiceFilesOf())

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toBeDefined()

        expect(transaction.rollbacks).toBe(1)
    })
})
