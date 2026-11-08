import { LessonImportService } from "@modules/domain/lesson"
import {
    SECRET,
    demoFilesOf,
    demoLocaleFilesOf,
    demoRootOf,
    sourceFileOf,
    writeFolder,
} from "../../fixtures/builders/lesson.builder"
import { useConceptsDirectory } from "../../world/concepts-directory.client"
import { LESSON_VERSIONS } from "../../fixtures/persistence/lesson.sql"
import { contentPortOf, lessonModules } from "../../world/lesson-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface VersionRow {
    version: string
    status: string
    content_hash: string
    imported_at: Date
}

const CHANGED_SOURCE = [sourceFileOf("workspace/source.ts", "export const source = 2\n")]

/**
 * Lesson import (integration): the real importer over the real primary database and the real disk. It proves that the first
 * import goes live, an identical import changes nothing and other bytes under a stored version are refused.
 */
describe("lesson import (integration)", () => {
    const world = useTestWorld({ modules: lessonModules })
    const concepts = useConceptsDirectory()
    const importer = (): LessonImportService => world.resolve(LessonImportService)
    const run = (ref: string, id: string) => ({ directory: concepts.path(), ref, only: id })
    const versionsOf = async (id: string): Promise<Array<VersionRow>> =>
        (await world.db.primary?.query<Array<VersionRow>>(LESSON_VERSIONS, [id])) ?? []

    it("stores a valid folder as the live version and reports its counts, version and hashes", async () => {
        await writeFolder(concepts.path(), "2-first", demoFilesOf())

        const [report] = await importer().import(run("v1", "2-first"))
        const stored = await versionsOf("first")

        expect(report).toMatchObject({ id: "first", version: "v1", status: "created", sections: 6, activities: 6 })
        expect(report?.contentHash).toMatch(/^[0-9a-f]{64}$/u)
        expect(stored.map((row) => [row.version, row.status, row.content_hash])).toEqual([
            ["v1", "published", report?.contentHash],
        ])
    })

    it("leaves an identical import as it was: no new row, the same import time", async () => {
        await writeFolder(concepts.path(), "2-same", demoFilesOf())
        await importer().import(run("v1", "2-same"))
        const before = await versionsOf("same")

        const [again] = await importer().import(run("v1", "2-same"))

        expect(again?.status).toBe("unchanged")
        expect(await versionsOf("same")).toEqual(before)
    })

    it("refuses other bytes under a stored version and keeps the stored version live", async () => {
        await writeFolder(concepts.path(), "2-fixed", demoFilesOf())
        await importer().import(run("v1", "2-fixed"))
        const before = await versionsOf("fixed")
        await writeFolder(concepts.path(), "2-fixed", CHANGED_SOURCE)

        await expect(importer().import(run("v1", "2-fixed"))).rejects.toMatchObject({
            code: "LESSON_VERSION_IMMUTABLE",
        })

        expect(await versionsOf("fixed")).toEqual(before)
    })
})

/** Lesson versions (integration): a new version supersedes the old one, a failed version never touches the live one. */
describe("lesson versions (integration)", () => {
    const world = useTestWorld({ modules: lessonModules })
    const concepts = useConceptsDirectory()
    const importer = (): LessonImportService => world.resolve(LessonImportService)
    const run = (ref: string, id: string) => ({ directory: concepts.path(), ref, only: id })
    const versionsOf = async (id: string): Promise<Array<VersionRow>> =>
        (await world.db.primary?.query<Array<VersionRow>>(LESSON_VERSIONS, [id])) ?? []

    it("supersedes the live version when a new version is imported, leaving exactly one live", async () => {
        await writeFolder(concepts.path(), "2-moving", demoFilesOf())
        await importer().import(run("v1", "2-moving"))
        await writeFolder(concepts.path(), "2-moving", CHANGED_SOURCE)

        const [report] = await importer().import(run("v2", "2-moving"))
        const stored = await versionsOf("moving")

        expect(report?.status).toBe("created")
        expect(stored.map((row) => [row.version, row.status])).toEqual([
            ["v1", "superseded"],
            ["v2", "published"],
        ])
    })

    it("leaves the previous version live when the next version fails validation", async () => {
        await writeFolder(concepts.path(), "2-steady", demoFilesOf())
        await importer().import(run("v1", "2-steady"))
        const before = await versionsOf("steady")
        const broken = { ...demoRootOf("vi"), learningOutcomes: [{ id: "other", text: "x" }] }
        await writeFolder(concepts.path(), "2-steady", demoLocaleFilesOf("vi", broken))

        await expect(importer().import(run("v2", "2-steady"))).rejects.toMatchObject({
            code: "LESSON_CONTENT_INVALID",
        })

        expect(await versionsOf("steady")).toEqual(before)
    })

    it("stores each folder under its own id when it imports a whole directory", async () => {
        await writeFolder(concepts.path(), "1-alpha", demoFilesOf())
        await writeFolder(concepts.path(), "2-beta", demoFilesOf())

        const reports = await importer().import({ directory: concepts.path(), ref: "v1", only: "" })

        expect(reports.map((report) => [report.id, report.status])).toEqual([
            ["alpha", "created"],
            ["beta", "created"],
        ])
    })
})

/** The server-side content port over the real primary database: the grading side reads whole activities through it. */
describe("lesson content port (integration)", () => {
    const world = useTestWorld({ modules: lessonModules })
    const concepts = useConceptsDirectory()

    it("serves the whole stored activity, with its answers and rubric, to the grading side of a stored version", async () => {
        await writeFolder(concepts.path(), "2-graded", demoFilesOf())
        await world.resolve(LessonImportService).import({ directory: concepts.path(), ref: "v1", only: "2-graded" })

        const found = await contentPortOf(world).activity({
            lessonId: "graded",
            version: "v1",
            activityId: "demo--predict",
            locale: "en",
        })

        expect(found.phase).toBe("predict")
        expect(found.activity.options?.map((option) => option.isCorrect)).toEqual([true, false, false])
        expect(found.activity.answer?.explanation).toBe(`${SECRET} choice answer`)
    })

    it("refuses an activity or a version the store does not hold", async () => {
        await expect(
            contentPortOf(world).activity({
                lessonId: "graded",
                version: "v9",
                activityId: "demo--predict",
                locale: "vi",
            }),
        ).rejects.toMatchObject({ code: "LESSON_NOT_FOUND" })
    })
})
