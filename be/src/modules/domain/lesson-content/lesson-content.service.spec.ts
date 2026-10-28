import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import { LessonContentService } from "./lesson-content.service"
import { LessonContentVersionEntity } from "./persistence/entities/lesson-content.entity"
import { INSERT_LESSON_GRADING, INSERT_LESSON_VERSION } from "./persistence/lesson-content.sql"
import { sha256Hex } from "./academy-document.mapper"
import { readAcademySource } from "./academy-source.client"
import { DEFAULT_LESSON_FIXTURE } from "./lesson-content.contracts"

jest.setTimeout(180_000)

const specError = (reason: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.PayloadCorrupt, params: { reason } })

const parseJson = (text: string): unknown => {
    try {
        return JSON.parse(text)
    } catch (error) {
        throw new LessonContentError({
            code: LessonContentErrorCode.ManifestInvalid,
            params: { field: "manifest.json" },
            cause: error,
        })
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const recordsOf = (manifest: Record<string, unknown>, field: string): Array<Record<string, unknown>> => {
    const value = manifest[field]
    if (!Array.isArray(value) || !value.every(isRecord)) throw specError(`no ${field}`)
    return value
}

const fixturePathOf = (entry: Record<string, unknown>): string => String(entry.fixturePath)

const FIXTURE = resolve(__dirname, "..", "..", "..", "..", "..", DEFAULT_LESSON_FIXTURE)
const NOW = "2026-01-01T00:00:00.000Z"
const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const build = async (entityManager: MockEntityManager) => {
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            LessonContentService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(LessonContentService), logger }
}

const publishing = () =>
    fakeTransaction(
        mockEntityManager({
            findOne: [LessonContentVersionEntity, null],
            query: [
                [INSERT_LESSON_VERSION, []],
                [INSERT_LESSON_GRADING, []],
            ],
        }),
    )

const withMutatedFixture = async (
    mutate: (dir: string, manifest: Record<string, unknown>) => Promise<void> | void,
    run: (dir: string) => Promise<void> | void,
): Promise<void> => {
    const dir = await mkdtemp(join(tmpdir(), "lesson-fixture-"))
    try {
        await cp(FIXTURE, dir, { recursive: true })
        const manifestPath = join(dir, "manifest.json")
        const manifest: unknown = parseJson((await readFile(manifestPath)).toString("utf8"))
        if (!isRecord(manifest)) throw specError("manifest is not an object")
        await mutate(dir, manifest)
        await writeFile(manifestPath, JSON.stringify(manifest), "utf8")
        await run(dir)
    } finally {
        await rm(dir, { recursive: true, force: true })
    }
}

const manifestSha256 = async (): Promise<string> => (await readAcademySource(FIXTURE)).manifestSha256

const invalid = LessonContentErrorCode.ManifestInvalid
const mismatch = LessonContentErrorCode.SourceMismatch

/** Imports the named fixture directory and answers the rejection. */
const importFails = async (dir: string, error: string): Promise<void> => {
    const { service } = await build(publishing().em)
    await expect(service.importLessons({ fixtureDir: dir })).rejects.toThrow(error)
}

/** Rewrites one source file and the manifest entry that records it. */
const rewriteFile = async (
    dir: string,
    manifest: Record<string, unknown>,
    fixturePath: string,
    alter: (text: string) => string,
): Promise<void> => {
    const path = join(dir, ...fixturePath.split("/"))
    const altered = alter((await readFile(path)).toString("utf8"))
    await writeFile(path, altered, "utf8")
    const entry = recordsOf(manifest, "files").find((file) => fixturePathOf(file) === fixturePath)
    if (entry === undefined) throw specError(`no entry for ${fixturePath}`)
    const raw = await readFile(path)
    entry.bytes = raw.byteLength
    entry.sha256 = sha256Hex(raw)
}

/** Removes one source file and the manifest entry that records it. */
const removeFile = async (dir: string, manifest: Record<string, unknown>, fixturePath: string): Promise<void> => {
    manifest.files = recordsOf(manifest, "files").filter((file) => fixturePathOf(file) !== fixturePath)
    await rm(join(dir, ...fixturePath.split("/")))
}

/** Adds one file to the snapshot and the manifest entry that records it. */
const addFile = async (
    dir: string,
    manifest: Record<string, unknown>,
    fixturePath: string,
    bytes: Uint8Array,
): Promise<void> => {
    await mkdir(join(dir, ...fixturePath.split("/").slice(0, -1)), { recursive: true })
    await writeFile(join(dir, ...fixturePath.split("/")), bytes)
    recordsOf(manifest, "files").push({
        sourcePath: "x",
        fixturePath,
        bytes: bytes.byteLength,
        sha256: sha256Hex(bytes),
    })
}

describe("LessonContentService importLessons publishes the settled fixture", () => {
    it("publishes the settled fixture atomically and reports counts, version and hashes", async () => {
        const tx = publishing()
        const { service, logger } = await build(tx.em)

        const report = await service.importLessons({ fixtureDir: FIXTURE })

        expect(report).toMatchObject({
            contentId: "academy-rest-semantics",
            version: "1.0.0",
            status: "published",
            sourceHash: await manifestSha256(),
            variants: 8,
            locales: 2,
            challenges: 4,
            protectedInterviewItems: 24,
        })
        expect(Object.keys(report.fileHashes)).toHaveLength(26)
        expect(tx.commits).toBe(1)
        expect(tx.committedWrites.map((write) => write.method)).toEqual(["query", "query"])
        expect(logger.info).toHaveBeenCalledWith(
            "lessons.imported",
            expect.objectContaining({ contentId: "academy-rest-semantics", version: "1.0.0", status: "published" }),
        )
    })

    it("defaults to the bundled fixture path when the caller does not pick one", async () => {
        const { service } = await build(publishing().em)

        await expect(service.importLessons({ fixtureDir: undefined })).rejects.toThrow(invalid)
    })
})

describe("LessonContentService importLessons keeps imported versions immutable", () => {
    it("answers unchanged when the same version was imported with identical bytes", async () => {
        const tx = fakeTransaction(
            mockEntityManager({
                findOne: [
                    LessonContentVersionEntity,
                    {
                        contentId: "academy-rest-semantics",
                        version: "1.0.0",
                        sourceHash: await manifestSha256(),
                        payload: {},
                        createdAt: new Date(NOW),
                    },
                ],
            }),
        )
        const { service } = await build(tx.em)

        const report = await service.importLessons({ fixtureDir: FIXTURE })

        expect(report.status).toBe("unchanged")
        expect(tx.committedWrites).toHaveLength(0)
    })

    it("refuses the same version imported with different bytes and keeps the old version", async () => {
        const tx = fakeTransaction(
            mockEntityManager({
                findOne: [
                    LessonContentVersionEntity,
                    {
                        contentId: "academy-rest-semantics",
                        version: "1.0.0",
                        sourceHash: "0".repeat(64),
                        payload: {},
                        createdAt: new Date(NOW),
                    },
                ],
            }),
        )
        const { service } = await build(tx.em)

        await expect(service.importLessons({ fixtureDir: FIXTURE })).rejects.toThrow(
            LessonContentErrorCode.VersionConflict,
        )
        expect(tx.rollbacks).toBe(1)
    })
})

describe("LessonContentService importLessons validates the manifest axes and article records", () => {
    it("refuses a manifest that dropped or mistyped a declared locale or language", async () => {
        await withMutatedFixture(
            (_dir, manifest) => {
                manifest.locales = ["en"]
            },
            (dir) => importFails(dir, invalid),
        )
        await withMutatedFixture(
            (_dir, manifest) => {
                manifest.locales = ["en", "fr"]
            },
            (dir) => importFails(dir, invalid),
        )
        await withMutatedFixture(
            (_dir, manifest) => {
                manifest.programmingLanguages = ["typescript"]
            },
            (dir) => importFails(dir, invalid),
        )
    })

    it("refuses an articles index that lost, duplicated or mistyped an entry", async () => {
        await withMutatedFixture(
            async (dir, manifest) => {
                const articles = recordsOf(manifest, "articles")
                const last = articles[articles.length - 1]
                if (last === undefined) throw specError("no articles")
                await removeFile(dir, manifest, fixturePathOf(last))
                manifest.articles = articles.slice(0, -1)
            },
            (dir) => importFails(dir, invalid),
        )
        await withMutatedFixture(
            (_dir, manifest) => {
                const articles = recordsOf(manifest, "articles")
                const first = articles[0]
                if (first === undefined || articles.length < 2) throw specError("no articles")
                manifest.articles = articles.map((entry, at) =>
                    at === 1
                        ? {
                              ...entry,
                              locale: String(first.locale),
                              programmingLanguage: String(first.programmingLanguage),
                          }
                        : entry,
                )
            },
            (dir) => importFails(dir, invalid),
        )
        await withMutatedFixture(
            (_dir, manifest) => {
                const first = recordsOf(manifest, "articles")[0]
                if (first === undefined) throw specError("no articles")
                first.programmingLanguage = "rust"
            },
            (dir) => importFails(dir, invalid),
        )
    })
})

describe("LessonContentService importLessons validates files and the derived index", () => {
    it("refuses an article whose recorded index does not match the derived one", async () => {
        await withMutatedFixture(
            (_dir, manifest) => {
                const first = recordsOf(manifest, "articles")[0]
                if (first === undefined) throw specError("no articles")
                const outline = recordsOf(first, "outline")
                const entry = outline[0]
                if (entry === undefined || typeof entry.start !== "number") throw specError("no outline")
                entry.start = entry.start + 1
            },
            (dir) => importFails(dir, LessonContentErrorCode.IndexMismatch),
        )
    })

    it("refuses an article file the manifest indexes but does not list", async () => {
        await withMutatedFixture(
            (dir, manifest) => removeFile(dir, manifest, "original/bodies/0-typescript/en.md"),
            (dir) => importFails(dir, mismatch),
        )
    })

    it("refuses a file the manifest lists under no role", async () => {
        await withMutatedFixture(
            (dir, manifest) => addFile(dir, manifest, "original/junk.md", encode("junk")),
            (dir) => importFails(dir, invalid),
        )
    })

    it("refuses a locale with no metadata file", async () => {
        await withMutatedFixture(
            (dir, manifest) => removeFile(dir, manifest, "original/vi.md"),
            (dir) => importFails(dir, mismatch),
        )
    })
})

describe("LessonContentService importLessons validates the challenges", () => {
    it("refuses an incomplete challenge set", async () => {
        const challenge = "0-restful-api-crud-best-practices-easy"
        await withMutatedFixture(
            (dir, manifest) => removeFile(dir, manifest, `original/challenges/${challenge}/vi.md`),
            (dir) => importFails(dir, mismatch),
        )
        await withMutatedFixture(
            async (dir, manifest) => {
                manifest.files = recordsOf(manifest, "files").filter(
                    (file) => !fixturePathOf(file).startsWith(`original/challenges/${challenge}/submissions/`),
                )
                await rm(join(dir, "original", "challenges", challenge, "submissions"), { recursive: true })
            },
            (dir) => importFails(dir, mismatch),
        )
        await withMutatedFixture(
            (dir, manifest) => removeFile(dir, manifest, `original/challenges/${challenge}/submissions/0/vi.md`),
            (dir) => importFails(dir, mismatch),
        )
        await withMutatedFixture(
            async (dir, manifest) => {
                const source = await readFile(
                    join(dir, "original", "challenges", challenge, "submissions", "0", "en.md"),
                )
                await addFile(dir, manifest, "original/challenges/9-orphan/submissions/0/en.md", source)
            },
            (dir) => importFails(dir, mismatch),
        )
    })

    it("refuses a challenge whose sortIndex differs by locale and a body with unknown fields", async () => {
        const challenge = "0-restful-api-crud-best-practices-easy"
        await withMutatedFixture(
            (dir, manifest) =>
                rewriteFile(dir, manifest, `original/challenges/${challenge}/vi.md`, (text) => {
                    const altered = text.replace(
                        /(# sortIndex\r?\n<!-- @starci\/seperator -->\r?\n)(\d+)(\r?\n)/,
                        (_match, head: string, value: string, tail: string) => `${head}${Number(value) + 7}${tail}`,
                    )
                    if (altered === text) throw specError("sortIndex not found")
                    return altered
                }),
            (dir) => importFails(dir, LessonContentErrorCode.SourceMalformed),
        )
        await withMutatedFixture(
            (dir, manifest) =>
                rewriteFile(
                    dir,
                    manifest,
                    "original/bodies/0-typescript/en.md",
                    (text) => `${text}# answer\n<!-- @starci/seperator -->\n42\n<!-- @starci/seperator -->\n`,
                ),
            (dir) => importFails(dir, LessonContentErrorCode.ClassificationUnknown),
        )
    })
})
