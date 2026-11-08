import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import {
    DEMO_SOURCE_KEY,
    demoFilesOf,
    demoLocaleFilesOf,
    demoModuleStepsOf,
    demoTopicCatalogOf,
} from "@tests/fixtures/builders/lesson.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { LessonErrorCode } from "./errors/lesson.error"
import {
    INSERT_VERSION,
    SELECT_VERSION_HASH,
    SUPERSEDE_PUBLISHED,
    UPDATE_SOURCE_KEY,
    UPSERT_TOPIC,
} from "./persistence/lesson.sql"
import { contentHashOf } from "./lesson-draft.policy"
import { LessonImportService } from "./lesson-import.service"
import type { LessonTopicCatalog } from "./lesson-topic.contracts"
import { LESSON_TOPIC_CATALOG } from "./lesson.decorators"
import { LESSON_SOURCE, type LessonSourceReader } from "./lesson-source.port"
import type { LessonSourceFile } from "./lesson-import.contracts"

const NOW = "2026-11-08T10:00:00.000Z"
const DIRECTORY = "concepts"
const REF = "231d8cc57"

const invalidFolderFiles = (): Array<LessonSourceFile> => demoFilesOf().filter((file) => file.path !== "en.md")

const build = async (em: MockEntityManager, folders: Record<string, ReadonlyArray<LessonSourceFile>>) => {
    const source = mock<LessonSourceReader>()
    source.folders.mockResolvedValue(Object.keys(folders))
    source.modules.mockImplementation((_directory, module) => Promise.resolve(demoModuleStepsOf(module.index)))
    source.read.mockImplementation((_directory, folder) => Promise.resolve(folders[folder] ?? []))
    const logger = mock<Logger>()
    const transaction = fakeTransaction(em)
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonImportService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: transaction.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LESSON_SOURCE, useValue: source },
            { provide: LESSON_TOPIC_CATALOG, useValue: mock<LessonTopicCatalog>(demoTopicCatalogOf()) },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(LessonImportService), source, logger, transaction }
}

describe("LessonImportService import", () => {
    it("stores a valid folder as the new live version and reports its counts, version and hashes", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_VERSION_HASH, []],
                [SUPERSEDE_PUBLISHED, []],
                [INSERT_VERSION, [{ lesson_id: "demo-lesson" }]],
                [UPSERT_TOPIC, [{ topic: "demo-topic" }]],
            ],
        })
        const files = demoFilesOf()
        const { service, logger, transaction } = await build(em, { "2-demo-lesson": files })

        const reports = await service.import({ directory: DIRECTORY, ref: REF, only: "" })

        expect(reports).toEqual([
            {
                folder: "2-demo-lesson",
                id: "demo-lesson",
                version: REF,
                status: "created",
                contentHash: contentHashOf(files),
                files: files.length,
                sections: 6,
                activities: 6,
                issues: [],
            },
        ])
        expect(logger.info).toHaveBeenCalledWith("lesson.imported", reports[0])
        expect(transaction.commits).toBe(1)
        expect(em.query.mock.calls.map((call) => call[0])).toEqual([
            SELECT_VERSION_HASH,
            SUPERSEDE_PUBLISHED,
            INSERT_VERSION,
            UPSERT_TOPIC,
        ])
        const [, insertParams] = em.query.mock.calls[2] ?? []
        expect(insertParams?.slice(0, 8)).toEqual([
            "demo-lesson",
            REF,
            contentHashOf(files),
            "backend",
            "intermediate",
            95,
            "typescript",
            2,
        ])
        expect(insertParams?.[8]).toBe('{"vi":"vi: Demo lesson","en":"en: Demo lesson"}')
        expect(insertParams?.[9]).toBe(
            '{"vi":"vi: One concept to test the import.","en":"en: One concept to test the import."}',
        )
        expect(insertParams?.[12]).toEqual(new Date(NOW))
        expect(insertParams?.[13]).toBe("backend")
        expect(insertParams?.[14]).toBe("demo-topic")
        expect(insertParams?.[15]).toBe(DEMO_SOURCE_KEY)
        const [, topicParams] = em.query.mock.calls[3] ?? []
        expect(topicParams?.slice(0, 6)).toEqual([
            "demo-topic",
            "Demo topic",
            "Demo course module 0 and 1",
            "About the demo topic.",
            '["Know the demo."]',
            '["plain-topic"]',
        ])
        expect(topicParams?.[6]).toBe(
            JSON.stringify(
                [...demoModuleStepsOf(0), ...demoModuleStepsOf(1)].map((step, index) => ({
                    ...step,
                    order: index + 1,
                })),
            ),
        )
    })
})

describe("LessonImportService import of a topic without page copy", () => {
    it("stores the topic with no description, prerequisites or related topics", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_VERSION_HASH, []],
                [SUPERSEDE_PUBLISHED, []],
                [INSERT_VERSION, [{ lesson_id: "beta" }]],
                [UPSERT_TOPIC, [{ topic: "plain-topic" }]],
            ],
        })
        const { service, source } = await build(em, { "2-beta": demoFilesOf() })

        await service.import({ directory: DIRECTORY, ref: REF, only: "" })

        const [, topicParams] = em.query.mock.calls[3] ?? []
        expect(topicParams?.slice(0, 7)).toEqual(["plain-topic", "Plain topic", "Nowhere", null, "null", "null", "[]"])
        expect(source.modules).not.toHaveBeenCalled()
    })
})

describe("LessonImportService import of a stored version", () => {
    it("leaves an identical version alone: no write, a report that says unchanged", async () => {
        const files = demoFilesOf()
        const em = mockEntityManager({
            query: [SELECT_VERSION_HASH, [{ content_hash: contentHashOf(files), source_key: DEMO_SOURCE_KEY }]],
        })
        const { service, transaction } = await build(em, { "2-demo-lesson": files })

        const reports = await service.import({ directory: DIRECTORY, ref: REF, only: "" })

        expect(reports.map((report) => report.status)).toEqual(["unchanged"])
        expect(transaction.commits).toBe(0)
        expect(em.query).toHaveBeenCalledTimes(1)
    })

    it("repoints an identical version whose topic path row changed, without touching its content", async () => {
        const files = demoFilesOf()
        const em = mockEntityManager({
            query: [
                [
                    SELECT_VERSION_HASH,
                    [{ content_hash: contentHashOf(files), source_key: "courses/old/modules/0-a/contents/0-b" }],
                ],
                [UPDATE_SOURCE_KEY, []],
            ],
        })
        const { service, transaction } = await build(em, { "2-demo-lesson": files })

        const reports = await service.import({ directory: DIRECTORY, ref: REF, only: "" })

        expect(reports.map((report) => report.status)).toEqual(["relinked"])
        expect(transaction.commits).toBe(0)
        expect(em.query).toHaveBeenLastCalledWith(UPDATE_SOURCE_KEY, ["demo-lesson", REF, DEMO_SOURCE_KEY])
    })

    it("refuses other bytes under a stored version, writes nothing and fails after reporting", async () => {
        const files = demoFilesOf()
        const em = mockEntityManager({ query: [SELECT_VERSION_HASH, [{ content_hash: "0".repeat(64) }]] })
        const { service, logger, transaction } = await build(em, { "2-demo-lesson": files })

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toMatchObject({
            code: LessonErrorCode.VersionImmutable,
            params: { folders: "2-demo-lesson" },
        })

        expect(transaction.commits).toBe(0)
        expect(em.query).toHaveBeenCalledTimes(1)
        expect(logger.info).toHaveBeenCalledWith(
            "lesson.imported",
            expect.objectContaining({
                status: "refused",
                issues: [
                    {
                        path: "2-demo-lesson",
                        field: "",
                        message: `version ${REF} is stored with hash ${"0".repeat(64)}, the source has ${contentHashOf(files)}`,
                    },
                ],
            }),
        )
    })
})

describe("LessonImportService import failures", () => {
    it("never touches the database for an invalid folder and still stores the valid one beside it", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_VERSION_HASH, []],
                [SUPERSEDE_PUBLISHED, []],
                [INSERT_VERSION, [{ lesson_id: "demo-lesson" }]],
                [UPSERT_TOPIC, [{ topic: "demo-topic" }]],
            ],
        })
        const { service, logger } = await build(em, {
            "1-broken": invalidFolderFiles(),
            "2-demo-lesson": demoFilesOf(),
        })

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toMatchObject({
            code: LessonErrorCode.ContentInvalid,
            params: { folders: "1-broken" },
        })

        expect(em.query.mock.calls.map((call) => call[0])).toEqual([
            SELECT_VERSION_HASH,
            SUPERSEDE_PUBLISHED,
            INSERT_VERSION,
            UPSERT_TOPIC,
        ])
        expect(logger.info).toHaveBeenCalledWith(
            "lesson.imported",
            expect.objectContaining({
                folder: "1-broken",
                status: "invalid",
                sections: 0,
                activities: 0,
                issues: [{ path: "en.md", field: "", message: "is missing" }],
            }),
        )
    })

    it("reports a refused folder before an invalid one when both fail", async () => {
        const files = demoFilesOf()
        const em = mockEntityManager({ query: [SELECT_VERSION_HASH, [{ content_hash: "0".repeat(64) }]] })
        const { service } = await build(em, { "1-broken": invalidFolderFiles(), "2-demo-lesson": files })

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toMatchObject({
            code: LessonErrorCode.VersionImmutable,
            params: { folders: "1-broken, 2-demo-lesson" },
        })
    })

    it("imports only the folders it is asked for, ignoring empty names in the list", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_VERSION_HASH, []],
                [SUPERSEDE_PUBLISHED, []],
                [INSERT_VERSION, [{ lesson_id: "demo-lesson" }]],
                [UPSERT_TOPIC, [{ topic: "demo-topic" }]],
            ],
        })
        const { service, source } = await build(em, {
            "1-other": demoLocaleFilesOf("vi"),
            "2-demo-lesson": demoFilesOf(),
        })

        const reports = await service.import({ directory: DIRECTORY, ref: REF, only: "2-demo-lesson,," })

        expect(reports.map((report) => report.folder)).toEqual(["2-demo-lesson"])
        expect(source.read).toHaveBeenCalledTimes(1)
    })
})

describe("LessonImportService import arguments", () => {
    it("refuses a folder the listing does not hold, naming it", async () => {
        const { service } = await build(mockEntityManager(), { "2-demo-lesson": demoFilesOf() })

        await expect(
            service.import({ directory: DIRECTORY, ref: REF, only: "2-demo-lesson,9-gone" }),
        ).rejects.toMatchObject({
            code: LessonErrorCode.ImportRejected,
            params: { folders: "9-gone" },
        })
    })

    it("refuses a call without a directory or without a version label", async () => {
        const { service, source } = await build(mockEntityManager(), {})

        await expect(service.import({ directory: " ", ref: REF, only: "" })).rejects.toMatchObject({
            code: LessonErrorCode.ImportRejected,
        })
        await expect(service.import({ directory: DIRECTORY, ref: "", only: "" })).rejects.toMatchObject({
            code: LessonErrorCode.ImportRejected,
        })
        expect(source.folders).not.toHaveBeenCalled()
    })

    it("rolls the supersede back and refuses when another import stored the same version first", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_VERSION_HASH, []],
                [SUPERSEDE_PUBLISHED, []],
                [INSERT_VERSION, []],
            ],
        })
        const { service, transaction } = await build(em, { "2-demo-lesson": demoFilesOf() })

        await expect(service.import({ directory: DIRECTORY, ref: REF, only: "" })).rejects.toMatchObject({
            code: LessonErrorCode.VersionImmutable,
        })

        expect(transaction.rollbacks).toBe(1)
        expect(transaction.committedWrites).toEqual([])
    })
})
