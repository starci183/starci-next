import { Test } from "@nestjs/testing"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { LessonContentErrorCode } from "./errors/lesson-content.error"
import { readAcademySource } from "./academy-source.client"
import { DEFAULT_LESSON_FIXTURE } from "./lesson-content.contracts"

const FIXTURE = resolve(__dirname, "..", "..", "..", "..", "..", DEFAULT_LESSON_FIXTURE)

const invalid = LessonContentErrorCode.ManifestInvalid
const mismatch = LessonContentErrorCode.SourceMismatch

const withTempDir = async (run: (dir: string) => Promise<void>): Promise<void> => {
    const dir = await mkdtemp(join(tmpdir(), "lesson-content-"))
    try {
        await run(dir)
    } finally {
        await rm(dir, { recursive: true, force: true })
    }
}

const minimalManifest = (files: ReadonlyArray<Record<string, unknown>>): string =>
    JSON.stringify({
        schema: "lessons.fixture-provenance@1",
        id: "fixture.lessons.demo.v1",
        version: "1.0.0",
        programmingLanguages: ["typescript"],
        locales: ["en"],
        files,
        articles: [],
    })

const SUBJECT = Symbol("academy-source")
const helpers = { readAcademySource }

/** Builds the subject through the testing module, the way consumers reach it. */
const build = async (): Promise<typeof helpers> =>
    (await Test.createTestingModule({ providers: [{ provide: SUBJECT, useFactory: () => helpers }] }).compile()).get<
        typeof helpers
    >(SUBJECT)

describe("readAcademySource", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("reads the settled fixture: manifest, every file and its hashes", async () => {
        const source = await subject.readAcademySource(FIXTURE)

        expect(source.manifest.contentId).toBe("academy-rest-semantics")
        expect(source.manifestSha256).toMatch(/^[0-9a-f]{64}$/)
        expect(source.files.size).toBe(26)
        expect(Object.keys(source.fileHashes)).toHaveLength(26)
        expect(source.files.get("original/en.md")?.byteLength).toBe(968)
    })

    it("refuses a directory with no readable manifest", async () => {
        await withTempDir(async (dir) => {
            await expect(subject.readAcademySource(dir)).rejects.toThrow(invalid)
        })
    })

    it("refuses a manifest that records a path escaping the fixture root", async () => {
        await withTempDir(async (dir) => {
            const files = [{ sourcePath: "x", fixturePath: "../escape.md", bytes: 1, sha256: "a".repeat(64) }]
            await writeFile(join(dir, "manifest.json"), minimalManifest(files), "utf8")

            await expect(subject.readAcademySource(dir)).rejects.toThrow(invalid)
        })
    })

    it("refuses a manifest that records an absolute or windows-separated path", async () => {
        await withTempDir(async (dir) => {
            const files = [
                { sourcePath: "x", fixturePath: "/abs.md", bytes: 1, sha256: "a".repeat(64) },
                { sourcePath: "x", fixturePath: "dir\\file.md", bytes: 1, sha256: "a".repeat(64) },
            ]
            await writeFile(join(dir, "manifest.json"), minimalManifest(files), "utf8")

            await expect(subject.readAcademySource(dir)).rejects.toThrow(invalid)
        })
    })

    it("refuses a recorded file that is missing on disk", async () => {
        await withTempDir(async (dir) => {
            const files = [{ sourcePath: "x", fixturePath: "original/en.md", bytes: 1, sha256: "a".repeat(64) }]
            await writeFile(join(dir, "manifest.json"), minimalManifest(files), "utf8")

            await expect(subject.readAcademySource(dir)).rejects.toThrow(mismatch)
        })
    })

    it("refuses a file whose bytes or hash differ from the manifest", async () => {
        await withTempDir(async (dir) => {
            await mkdir(join(dir, "original"), { recursive: true })
            await writeFile(join(dir, "original", "en.md"), "hello", "utf8")
            const files = [{ sourcePath: "x", fixturePath: "original/en.md", bytes: 5, sha256: "a".repeat(64) }]
            await writeFile(join(dir, "manifest.json"), minimalManifest(files), "utf8")

            await expect(subject.readAcademySource(dir)).rejects.toThrow(mismatch)
        })
    })
})
