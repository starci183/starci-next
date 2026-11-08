import { createHash } from "node:crypto"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { FILE_TITLE_VI } from "@tests/fixtures/i18n/interview-spec.messages"
import { interviewDirectory as directory } from "./interview-directory.client"

/** The token the testing module provides the directory under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.interview-directory.client")

/** Builds the directory reader from a testing module. */
const loadSubject = async (): Promise<typeof directory> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => directory }],
    }).compile()
    return moduleRef.get<typeof directory>(SUBJECT_TOKEN)
}

describe("interviewDirectory", () => {
    let root = ""
    let interviewDirectory: typeof directory

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-interview-"))
        interviewDirectory = await loadSubject()
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    it("lists the technical banks of every course and the behavioural banks, sorted by id, and ignores files beside them", async () => {
        await mkdir(join(root, "courses", "1-system-design-mastery", "mock-interview", "0-fundamentals"), {
            recursive: true,
        })
        await mkdir(join(root, "courses", "0-fullstack-mastery", "mock-interview", "1-data"), { recursive: true })
        await mkdir(join(root, "courses", "0-fullstack-mastery", "mock-interview", "0-core"), { recursive: true })
        await mkdir(join(root, "courses", "3-ai-llm-mastery"), { recursive: true })
        await writeFile(join(root, "courses", "0-fullstack-mastery", "mock-interview", "README.md"), "x")
        await mkdir(join(root, "mock-interview-eq", "1-behavioral"), { recursive: true })

        await expect(interviewDirectory.banks(root)).resolves.toEqual([
            { bankId: "0-fullstack-mastery/0-core", course: "0-fullstack-mastery", folder: "0-core" },
            { bankId: "0-fullstack-mastery/1-data", course: "0-fullstack-mastery", folder: "1-data" },
            {
                bankId: "1-system-design-mastery/0-fundamentals",
                course: "1-system-design-mastery",
                folder: "0-fundamentals",
            },
            { bankId: "eq/1-behavioral", course: null, folder: "1-behavioral" },
        ])
    })

    it("lists nothing for a checkout with no interview banks", async () => {
        await expect(interviewDirectory.banks(root)).resolves.toEqual([])
    })

    it("reads every file of a bank with the hash of its raw bytes, sorted by posix path", async () => {
        const folder = join(root, "courses", "0-fullstack-mastery", "mock-interview", "0-core")
        await mkdir(join(folder, "questions", "0-question"), { recursive: true })
        await writeFile(join(folder, "vi.md"), FILE_TITLE_VI)
        await writeFile(join(folder, "questions", "0-question", "en.md"), "q")

        const files = await interviewDirectory.read(root, {
            bankId: "0-fullstack-mastery/0-core",
            course: "0-fullstack-mastery",
            folder: "0-core",
        })

        expect(files.map((file) => file.path)).toEqual(["questions/0-question/en.md", "vi.md"])
        expect(files[1]).toMatchObject({
            text: FILE_TITLE_VI,
            sha256: createHash("sha256").update(Buffer.from(FILE_TITLE_VI)).digest("hex"),
        })
    })

    it("reads a behavioural bank from the shared folder", async () => {
        await mkdir(join(root, "mock-interview-eq", "1-behavioral"), { recursive: true })
        await writeFile(join(root, "mock-interview-eq", "1-behavioral", "en.md"), "e")

        const files = await interviewDirectory.read(root, {
            bankId: "eq/1-behavioral",
            course: null,
            folder: "1-behavioral",
        })

        expect(files.map((file) => file.path)).toEqual(["en.md"])
    })
})

describe("interviewDirectory with an overlay root", () => {
    let root = ""
    let interviewDirectory: typeof directory

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-interview-"))
        interviewDirectory = await loadSubject()
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    describe("overlay root", () => {
        let overlay = ""

        beforeEach(async () => {
            overlay = await mkdtemp(join(tmpdir(), "starci-interview-overlay-"))
        })

        afterEach(async () => {
            await rm(overlay, { recursive: true, force: true })
        })

        const core = { bankId: "0-fullstack-mastery/0-core", course: "0-fullstack-mastery", folder: "0-core" }

        it("lists the banks of both roots once, sorted by id", async () => {
            await mkdir(join(root, "courses", "0-fullstack-mastery", "mock-interview", "0-core"), { recursive: true })
            await mkdir(join(overlay, "courses", "0-fullstack-mastery", "mock-interview", "0-core"), {
                recursive: true,
            })
            await mkdir(join(overlay, "courses", "2-devops-mastery", "mock-interview", "0-bank"), { recursive: true })

            const found = await interviewDirectory.banks(root, overlay)

            expect(found.map((bank) => bank.bankId)).toEqual(["0-fullstack-mastery/0-core", "2-devops-mastery/0-bank"])
        })

        it("replaces a file of the same path, adds the new ones and keeps the rest of the checkout", async () => {
            const own = join(root, "courses", "0-fullstack-mastery", "mock-interview", "0-core")
            const over = join(overlay, "courses", "0-fullstack-mastery", "mock-interview", "0-core")
            await mkdir(join(own, "questions", "0-question"), { recursive: true })
            await mkdir(join(over, "questions", "0-question"), { recursive: true })
            await writeFile(join(own, "vi.md"), "bank")
            await writeFile(join(own, "questions", "0-question", "vi.md"), "old")
            await writeFile(join(over, "questions", "0-question", "vi.md"), "new")
            await writeFile(join(over, "questions", "0-question", "en.md"), "added")

            const files = await interviewDirectory.read(root, core, overlay)

            expect(files.map((file) => [file.path, file.text])).toEqual([
                ["questions/0-question/en.md", "added"],
                ["questions/0-question/vi.md", "new"],
                ["vi.md", "bank"],
            ])
        })

        it("reads a bank only the overlay holds", async () => {
            const over = join(overlay, "courses", "0-fullstack-mastery", "mock-interview", "0-core")
            await mkdir(over, { recursive: true })
            await writeFile(join(over, "vi.md"), "only here")

            const files = await interviewDirectory.read(root, core, overlay)

            expect(files.map((file) => file.path)).toEqual(["vi.md"])
        })
    })
})
