import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { behavioralFilesOf, technicalFilesOf } from "@tests/fixtures/builders/interview.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { contentHashOf } from "./bank-draft.policy"
import { INTERVIEW_SOURCE, type InterviewSourceReader } from "./interview-source.port"
import { InterviewImportService } from "./interview-import.service"
import { InterviewLogEvent } from "./interview.log-events"
import { INSERT_BANK, INSERT_QUESTION, SELECT_BANK_HASH } from "./persistence/interview.sql"
import { firstParamsOf } from "@tests/fixtures/builders/interview-stub.builder"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const TECH = { bankId: "0-fullstack-mastery/0-core", course: "0-fullstack-mastery", folder: "0-core" }
const EQ = { bankId: "eq/1-behavioral", course: null, folder: "1-behavioral" }
const HASH = contentHashOf(technicalFilesOf())

const build = async (stored: ReadonlyArray<object>, inserted: ReadonlyArray<object> = [{ bank_id: TECH.bankId }]) => {
    const tx = fakeTransaction(
        mockEntityManager({
            query: [
                [SELECT_BANK_HASH, stored],
                [INSERT_BANK, inserted],
                [INSERT_QUESTION, []],
            ],
        }),
    )
    const source = mock<InterviewSourceReader>()
    source.banks.mockResolvedValue([TECH, EQ])
    source.read.mockImplementation((_directory, bank) =>
        Promise.resolve(bank.course === null ? behavioralFilesOf() : technicalFilesOf()),
    )
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            InterviewImportService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: INTERVIEW_SOURCE, useValue: source },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(InterviewImportService), tx, source, logger }
}

const run = (only = "") => ({ directory: "data", ref: "231d8cc57", only })

describe("InterviewImportService import", () => {
    it("stores a new bank version as validated with its questions, and reports counts and hashes, never an answer", async () => {
        const { service, tx, logger } = await build([])

        const reports = await service.import(run(TECH.bankId))

        expect(reports).toEqual([
            {
                bankId: TECH.bankId,
                version: "231d8cc57",
                status: "created",
                contentHash: HASH,
                files: 6,
                questions: 1,
                skipped: 0,
                issues: [],
            },
        ])
        const bank = firstParamsOf(tx.em, INSERT_BANK)
        expect(bank.slice(0, 7)).toEqual([
            TECH.bankId,
            "231d8cc57",
            HASH,
            "technical",
            "0-fullstack-mastery",
            0,
            "medium",
        ])
        expect(bank[9]).toEqual(["0-core"])
        expect(tx.em.query.mock.calls.filter((call) => call[0] === INSERT_QUESTION)).toHaveLength(1)
        expect(logger.info).toHaveBeenCalledWith(
            InterviewLogEvent.Imported,
            expect.objectContaining({ bankId: TECH.bankId, status: "created" }),
        )
        expect(JSON.stringify(logger.info.mock.calls)).not.toContain("idealAnswer")
    })

    it("leaves an identical version alone and writes nothing for it", async () => {
        const { service, tx } = await build([{ content_hash: HASH, status: "published" }])

        const reports = await service.import(run(TECH.bankId))

        expect(reports.map((report) => report.status)).toEqual(["unchanged"])
        expect(tx.em.query.mock.calls.some((call) => call[0] === INSERT_BANK)).toBe(false)
    })

    it("imports every bank of the checkout when none is named", async () => {
        const { service } = await build([])

        const reports = await service.import(run())

        expect(reports.map((report) => [report.bankId, report.status])).toEqual([
            [TECH.bankId, "created"],
            [EQ.bankId, "created"],
        ])
    })
})

describe("InterviewImportService import (continued)", () => {
    it("refuses other bytes under a stored version, naming the bank, after trying every bank", async () => {
        const { service, source } = await build([{ content_hash: "other", status: "published" }])

        await expect(service.import(run())).rejects.toMatchObject({
            code: "INTERVIEW_BANK_IMMUTABLE",
            params: { banks: `${TECH.bankId}, ${EQ.bankId}` },
        })
        expect(source.read).toHaveBeenCalledTimes(2)
    })

    it("blocks a bank with an issue, names it, and stores nothing of it", async () => {
        const { service, source, tx } = await build([])
        source.read.mockResolvedValue([])

        await expect(service.import(run(TECH.bankId))).rejects.toMatchObject({ code: "INTERVIEW_BANK_INVALID" })
        expect(tx.em.query.mock.calls.some((call) => call[0] === INSERT_BANK)).toBe(false)
    })
})

describe("InterviewImportService import (continued) (continued)", () => {
    it("fails with INTERVIEW_BANK_IMMUTABLE when the database already holds the version", async () => {
        const { service, tx } = await build([], [])

        await expect(service.import(run(TECH.bankId))).rejects.toMatchObject({ code: "INTERVIEW_BANK_IMMUTABLE" })
        expect(tx.rollbacks).toBe(1)
    })

    it.each([
        ["no directory", { directory: " ", ref: "r", only: "" }],
        ["no ref", { directory: "d", ref: "", only: "" }],
        ["a bank that does not exist", { directory: "d", ref: "r", only: "nope" }],
    ])("rejects %s with INTERVIEW_IMPORT_REJECTED", async (_case, params) => {
        const { service } = await build([])

        await expect(service.import(params)).rejects.toMatchObject({ code: "INTERVIEW_IMPORT_REJECTED" })
    })

    it("asks the source for the overlay root too when the import is given one, and not otherwise", async () => {
        const { service, source } = await build([])

        await service.import({ ...run(TECH.bankId), overlay: "overlay" })
        await service.import(run(TECH.bankId))

        expect(source.banks).toHaveBeenNthCalledWith(1, "data", "overlay")
        expect(source.read).toHaveBeenNthCalledWith(1, "data", TECH, "overlay")
        expect(source.banks).toHaveBeenNthCalledWith(2, "data")
        expect(source.read).toHaveBeenNthCalledWith(2, "data", TECH)
    })
})
