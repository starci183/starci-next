import { createHash } from "node:crypto"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { lessonDirectory } from "./lesson-directory.client"
import { SEPARATOR_MARKER } from "./separator.policy"
import type { LessonSourceReader } from "./lesson-source.port"

const READER: unique symbol = Symbol("lesson.directory-client")

const build = async (): Promise<LessonSourceReader> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: READER, useFactory: () => lessonDirectory }],
    }).compile()
    return moduleRef.get<LessonSourceReader>(READER)
}

const sha256Of = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex")

describe("lessonDirectory", () => {
    let root = ""

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-lessons-"))
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    it("lists the folders below a directory by name and ignores the files beside them", async () => {
        const reader = await build()
        await mkdir(join(root, "2-b"))
        await mkdir(join(root, "0-a"))
        await writeFile(join(root, "README.md"), "x")

        await expect(reader.folders(root)).resolves.toEqual(["0-a", "2-b"])
    })

    it("reads every file below a folder with posix paths, its text and the hash of its raw bytes", async () => {
        const reader = await build()
        const bytes = Buffer.from([0xef, 0xbb, 0xbf, 0x68, 0x69, 0x0d, 0x0a])
        await mkdir(join(root, "0-a", "sections", "0-interview"), { recursive: true })
        await writeFile(join(root, "0-a", "vi.md"), "root")
        await writeFile(join(root, "0-a", "sections", "0-interview", "vi.md"), bytes)

        const files = await reader.read(root, "0-a")

        expect(files.map((file) => file.path)).toEqual(["sections/0-interview/vi.md", "vi.md"])
        expect(files[0]).toEqual({
            path: "sections/0-interview/vi.md",
            text: bytes.toString("utf8"),
            sha256: sha256Of(bytes),
        })
        expect(files[1]?.sha256).toBe(sha256Of(Buffer.from("root")))
    })
})

describe("lessonDirectory modules", () => {
    let root = ""
    let concepts = ""

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-courses-"))
        concepts = join(root, "concepts")
        await mkdir(concepts)
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    const titled = (title: string): string => `# title\n${SEPARATOR_MARKER}\n${title}\n${SEPARATOR_MARKER}\n`

    it("reads the content folders of a module in the teacher's order with their titles in both locales", async () => {
        const reader = await build()
        const contents = join(root, "courses", "demo-course", "modules", "1-demo-module", "contents")
        await mkdir(join(contents, "10-last"), { recursive: true })
        await mkdir(join(contents, "2-middle"), { recursive: true })
        await mkdir(join(contents, "0-first"), { recursive: true })
        await mkdir(join(contents, "bodies"), { recursive: true })
        await writeFile(join(contents, "0-first", "vi.md"), titled("Mot"))
        await writeFile(join(contents, "0-first", "en.md"), titled("One"))
        await writeFile(join(contents, "2-middle", "en.md"), titled("Two"))

        const steps = await reader.modules(concepts, { course: "demo-course", index: 1 })

        expect(steps).toEqual([
            {
                order: 1,
                key: "courses/demo-course/modules/1-demo-module/contents/0-first",
                titles: { vi: "Mot", en: "One" },
            },
            {
                order: 2,
                key: "courses/demo-course/modules/1-demo-module/contents/2-middle",
                titles: { vi: "2-middle", en: "Two" },
            },
            {
                order: 3,
                key: "courses/demo-course/modules/1-demo-module/contents/10-last",
                titles: { vi: "10-last", en: "10-last" },
            },
        ])
    })

    it("falls back to the folder name for a file with no title field", async () => {
        const reader = await build()
        const contents = join(root, "courses", "demo-course", "modules", "0-m", "contents", "0-a")
        await mkdir(contents, { recursive: true })
        await writeFile(join(contents, "vi.md"), "no fields here")
        await mkdir(join(contents, "..", "0-0"), { recursive: true })

        const steps = await reader.modules(concepts, { course: "demo-course", index: 0 })

        expect(steps.map((step) => step.titles.vi)).toEqual(["0-0", "0-a"])
    })

    it("answers no row for a course, or a module position, the checkout does not hold", async () => {
        const reader = await build()
        await mkdir(join(root, "courses", "demo-course", "modules", "0-m"), { recursive: true })

        await expect(reader.modules(concepts, { course: "missing-course", index: 0 })).resolves.toEqual([])
        await expect(reader.modules(concepts, { course: "demo-course", index: 7 })).resolves.toEqual([])
    })
})
