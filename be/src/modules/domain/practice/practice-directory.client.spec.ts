import { Test } from "@nestjs/testing"
import { createHash } from "node:crypto"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as subject from "./practice-directory.client"

const SUBJECT: unique symbol = Symbol("practice.practice-directory.client")

describe("practiceDirectory", () => {
    let practiceDirectory: typeof subject.practiceDirectory

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ practiceDirectory } = moduleRef.get<typeof subject>(SUBJECT))
    })

    let root = ""

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-practice-"))
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    it("lists every problem folder below sets/<pattern>/problems sorted by pattern and slug, skipping a set without problems", async () => {
        await mkdir(join(root, "sets", "strings", "problems", "echo"), { recursive: true })
        await mkdir(join(root, "sets", "arrays", "problems", "b-two"), { recursive: true })
        await mkdir(join(root, "sets", "arrays", "problems", "a-one"), { recursive: true })
        await mkdir(join(root, "sets", "empty"), { recursive: true })
        await writeFile(join(root, "sets", "README.md"), "x")

        await expect(practiceDirectory.entries(root)).resolves.toEqual([
            { pattern: "arrays", slug: "a-one" },
            { pattern: "arrays", slug: "b-two" },
            { pattern: "strings", slug: "echo" },
        ])
    })

    it("reads en.md and vi.md with the hash of their raw bytes and ignores the audit notes under .e2e", async () => {
        const folder = join(root, "sets", "arrays", "problems", "a-one")
        const bytes = Buffer.from([0xef, 0xbb, 0xbf, 0x68, 0x69, 0x0d, 0x0a])
        await mkdir(join(folder, ".e2e", "python"), { recursive: true })
        await writeFile(join(folder, "en.md"), bytes)
        await writeFile(join(folder, "vi.md"), "vi")
        await writeFile(join(folder, ".e2e", "python", "judge0-accepted.md"), "audit")

        const files = await practiceDirectory.read(root, { pattern: "arrays", slug: "a-one" })

        expect(files.map((file) => file.path)).toEqual(["en.md", "vi.md"])
        expect(files[0]?.sha256).toBe(createHash("sha256").update(bytes).digest("hex"))
        expect(files[1]?.text).toBe("vi")
    })

    it("answers only the locale files a folder holds", async () => {
        const folder = join(root, "sets", "arrays", "problems", "a-one")
        await mkdir(folder, { recursive: true })
        await writeFile(join(folder, "en.md"), "en")

        const files = await practiceDirectory.read(root, { pattern: "arrays", slug: "a-one" })

        expect(files.map((file) => file.path)).toEqual(["en.md"])
    })
})
