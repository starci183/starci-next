import { join } from "node:path"
import { FakeClock, builder, mock, type MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { InterviewImportService } from "@modules/domain/interview"
import { LessonImportService } from "@modules/domain/lesson"
import { PracticeImportService } from "@modules/domain/practice"
import { ReviewImportService } from "@modules/domain/review"
import type { ContentOptions } from "./content.options"
import { CONTENT_OPTIONS } from "./content.decorators"
import { CONTENT_DISK, type ContentDiskReader } from "./content-disk.port"
import { CONTENT_GIT, type ContentGitReader } from "./content-git.port"
import { ContentSyncService } from "./content-sync.service"
import { ContentErrorCode } from "./errors/content.error"

const NOW = "2026-11-09T10:00:00.000Z"
const MANIFEST = [
    "schema: starci-next-data/manifest@1",
    "name: starci-next-data",
    "contentVersion: 1",
    "kinds:",
    "  - id: paths",
    "    folder: paths",
    "    format: yaml",
    "    schema: outcome-path",
    "    source: this-repo",
    '    files: "^paths/[a-z-]+[.]yaml$"',
].join("\n")

const GIT_OPTIONS: Partial<ContentOptions> = {
    git: {
        datasourcesDir: "/ds",
        content: { url: "https://example.com/content.git", ref: null, token: null },
        data: { url: "https://example.com/data.git", ref: "pinned", token: null },
    },
}

const primeGit = (git: MockOf<ContentGitReader>): void => {
    git.fingerprint.mockImplementation((directory) => Promise.resolve(`fp-${directory}`))
    git.materialize.mockImplementation((params) =>
        Promise.resolve({
            created: true,
            snapshot: {
                source: params.source,
                sha: params.source === "content" ? "c0ffee0123456789" : "da7a0123456789ab",
                directory: `/ds/${params.source}`,
            },
        }),
    )
}

const primeDisk = (disk: MockOf<ContentDiskReader>): void => {
    disk.exists.mockResolvedValue(true)
    disk.folders.mockResolvedValue(["x"])
    disk.files.mockResolvedValue(["paths/founder.yaml", "README.md"])
    disk.text.mockResolvedValue(MANIFEST)
}

const build = async (overrides: Partial<ContentOptions> = {}) => {
    const options = builder<ContentOptions>({ git: null, environment: { read: () => ({}) } })(overrides)
    const git = mock<ContentGitReader>()
    const disk = mock<ContentDiskReader>()
    primeGit(git)
    primeDisk(disk)
    const lessons = mock<LessonImportService>()
    const interviews = mock<InterviewImportService>()
    const reviews = mock<ReviewImportService>()
    const practice = mock<PracticeImportService>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ContentSyncService,
            { provide: CONTENT_OPTIONS, useValue: options },
            { provide: CONTENT_GIT, useValue: git },
            { provide: CONTENT_DISK, useValue: disk },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: LessonImportService, useValue: lessons },
            { provide: InterviewImportService, useValue: interviews },
            { provide: ReviewImportService, useValue: reviews },
            { provide: PracticeImportService, useValue: practice },
        ],
    }).compile()
    return { service: moduleRef.get(ContentSyncService), git, disk, lessons, interviews, reviews, practice, logger }
}

describe("ContentSyncService sync from local directories", () => {
    it("imports every kind at the fingerprint of the checkouts, merging the overlay into the interview banks", async () => {
        const { service, lessons, interviews, reviews, practice, git, logger } = await build()

        const reports = await service.sync({ contentDir: "/c", dataDir: "/d", only: "" })

        expect(reports.map((report) => [report.kind, report.status])).toEqual([
            ["lessons", "imported"],
            ["interview", "imported"],
            ["review", "imported"],
            ["practice", "imported"],
            ["catalogs", "imported"],
        ])
        expect(git.materialize).not.toHaveBeenCalled()
        expect(lessons.import).toHaveBeenNthCalledWith(1, { directory: join("/d", "concepts"), ref: "fp-/d", only: "" })
        expect(lessons.import).toHaveBeenNthCalledWith(2, {
            directory: join("/c", "essentials"),
            ref: "fp-/c",
            only: "",
        })
        expect(interviews.import).toHaveBeenCalledWith({
            directory: "/d",
            ref: "fp-/d+fp-/c",
            only: "",
            overlay: join("/c", "interview", "overlay"),
        })
        expect(reviews.import).toHaveBeenCalledWith({ directory: "/d", ref: "fp-/d", only: "" })
        expect(practice.import).toHaveBeenCalledTimes(2)
        expect(reports[4]?.detail).toBe("paths=1")
        expect(logger.info).toHaveBeenCalledTimes(5)
    })

    it("runs only the kinds asked for and refuses a name it does not know", async () => {
        const { service, lessons, interviews } = await build()

        const reports = await service.sync({ contentDir: "/c", dataDir: "/d", only: "review" })

        expect(reports.map((report) => report.kind)).toEqual(["review"])
        expect(lessons.import).not.toHaveBeenCalled()
        expect(interviews.import).not.toHaveBeenCalled()
        await expect(service.sync({ contentDir: "/c", only: "bogus" })).rejects.toThrow(ContentErrorCode.SyncRejected)
    })

    it("skips what needs a data checkout when only the content directory is given, and imports the overlay as its own banks", async () => {
        const { service, interviews, reviews } = await build()

        const reports = await service.sync({ contentDir: "/c", only: "" })

        expect(reports.find((report) => report.kind === "review")).toMatchObject({ status: "skipped" })
        expect(interviews.import).toHaveBeenCalledWith({
            directory: join("/c", "interview", "overlay"),
            ref: "fp-/c",
            only: "",
        })
        expect(reviews.import).not.toHaveBeenCalled()
    })

    it("refuses a directory that does not exist and a sync that names no source", async () => {
        const { service, disk } = await build()
        disk.exists.mockResolvedValue(false)

        await expect(service.sync({ contentDir: "/missing", only: "" })).rejects.toThrow(ContentErrorCode.SyncRejected)
        await expect(service.sync({ only: "" })).rejects.toThrow(ContentErrorCode.SyncRejected)
    })
})

describe("ContentSyncService sync of folders that hold nothing", () => {
    it("skips the lessons and the practice sets when no source holds a folder", async () => {
        const { service, disk, lessons, practice } = await build()
        disk.folders.mockResolvedValue([])

        const reports = await service.sync({ contentDir: "/c", dataDir: "/d", only: "" })

        expect(reports.filter((report) => ["lessons", "practice"].includes(report.kind))).toEqual([
            { kind: "lessons", status: "skipped", version: "", detail: "no essentials folder" },
            { kind: "practice", status: "skipped", version: "", detail: "no sets folder" },
        ])
        expect(lessons.import).not.toHaveBeenCalled()
        expect(practice.import).not.toHaveBeenCalled()
    })

    it("skips the interview banks with no data checkout and no overlay", async () => {
        const { service, disk, interviews } = await build()
        disk.folders.mockResolvedValue([])

        const reports = await service.sync({ contentDir: "/c", only: "interview" })

        expect(reports).toEqual([
            { kind: "interview", status: "skipped", version: "", detail: "no data checkout and no overlay" },
        ])
        expect(interviews.import).not.toHaveBeenCalled()
    })

    it("imports the interview banks of the data checkout alone when there is no overlay", async () => {
        const { service, disk, interviews } = await build()
        disk.folders.mockImplementation((directory) => Promise.resolve(directory.includes("overlay") ? [] : ["x"]))

        const reports = await service.sync({ contentDir: "/c", dataDir: "/d", only: "interview" })

        expect(reports).toEqual([{ kind: "interview", status: "imported", version: "fp-/d", detail: "data only" }])
        expect(interviews.import).toHaveBeenCalledWith({ directory: "/d", ref: "fp-/d", only: "" })
    })
})

describe("ContentSyncService sync failures", () => {
    it("keeps going when a kind fails, reports it by code, fails the call at the end and does not record the snapshots", async () => {
        const { service, lessons, interviews, disk, logger } = await build(GIT_OPTIONS)
        lessons.import.mockRejectedValue(new Error("LESSON_CONTENT_INVALID"))

        await expect(service.sync({ only: "" })).rejects.toThrow(ContentErrorCode.SyncFailed)

        expect(interviews.import).toHaveBeenCalled()
        expect(logger.error).toHaveBeenCalledWith("content.synced", expect.any(Error), {
            kind: "lessons",
            status: "failed",
            detail: "LESSON_CONTENT_INVALID",
        })
        expect(disk.writeJson).not.toHaveBeenCalled()
    })

    it("reports a failure that carries no code as unexpected, so no stray text reaches the log line", async () => {
        const { service, reviews, logger } = await build()
        reviews.import.mockRejectedValue(new Error("ENOENT: no such file C:/secret/path"))

        await expect(service.sync({ contentDir: "/c", dataDir: "/d", only: "review" })).rejects.toThrow(
            ContentErrorCode.SyncFailed,
        )

        expect(logger.error).toHaveBeenCalledWith("content.synced", expect.any(Error), {
            kind: "review",
            status: "failed",
            detail: "UNEXPECTED",
        })
    })
})

describe("ContentSyncService sync from the git mount", () => {
    it("pulls both repositories, imports at the short sha and records the active snapshots", async () => {
        const { service, git, reviews, disk, logger } = await build(GIT_OPTIONS)

        await service.sync({ only: "" })

        expect(git.materialize).toHaveBeenCalledTimes(2)
        expect(git.materialize).toHaveBeenCalledWith({
            source: "data",
            config: GIT_OPTIONS.git?.data,
            datasourcesDir: "/ds",
            now: NOW,
        })
        expect(reviews.import).toHaveBeenCalledWith({ directory: "/ds/data", ref: "da7a01234", only: "" })
        expect(disk.writeJson).toHaveBeenCalledWith(join("/ds", "active.json"), {
            schema: "starci-next/datasource-active@1",
            content: { sha: "c0ffee0123456789", directory: "/ds/content" },
            data: { sha: "da7a0123456789ab", directory: "/ds/data" },
            syncedAt: NOW,
        })
        expect(logger.info).toHaveBeenCalledWith("content.pulled", {
            source: "content",
            sha: "c0ffee0123456789",
            created: true,
        })
    })

    it("prefers a local directory over the git mount for that repository only", async () => {
        const { service, git } = await build(GIT_OPTIONS)

        await service.sync({ dataDir: "/d", only: "review" })

        expect(git.materialize).toHaveBeenCalledTimes(1)
        expect(git.materialize).toHaveBeenCalledWith(expect.objectContaining({ source: "content" }))
    })
})
