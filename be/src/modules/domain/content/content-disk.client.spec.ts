import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { contentDisk } from "./content-disk.client"
import type { ContentDiskReader } from "./content-disk.port"

const CONTENT_DISK_READER: unique symbol = Symbol("content.disk-reader")

const build = async (): Promise<ContentDiskReader> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: CONTENT_DISK_READER, useFactory: () => contentDisk }],
    }).compile()
    return moduleRef.get<ContentDiskReader>(CONTENT_DISK_READER)
}

describe("contentDisk", () => {
    let root = ""
    let disk: ContentDiskReader

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-content-disk-"))
        disk = await build()
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    it("says whether a path exists", async () => {
        await expect(disk.exists(root)).resolves.toBe(true)
        await expect(disk.exists(join(root, "nope"))).resolves.toBe(false)
    })

    it("lists the sub-folders sorted, ignoring files, and nothing for a missing directory", async () => {
        await mkdir(join(root, "b"))
        await mkdir(join(root, "a"))
        await writeFile(join(root, "file.md"), "x")

        await expect(disk.folders(root)).resolves.toEqual(["a", "b"])
        await expect(disk.folders(join(root, "nope"))).resolves.toEqual([])
    })

    it("lists every file as a posix path, sorted, without the git folder", async () => {
        await mkdir(join(root, "paths"))
        await mkdir(join(root, ".git"))
        await writeFile(join(root, "paths", "founder.yaml"), "x")
        await writeFile(join(root, "manifest.yaml"), "x")
        await writeFile(join(root, ".git", "HEAD"), "x")

        await expect(disk.files(root)).resolves.toEqual(["manifest.yaml", "paths/founder.yaml"])
        await expect(disk.files(join(root, "nope"))).resolves.toEqual([])
    })

    it("reads a text file and writes a JSON document, creating the directory", async () => {
        const target = join(root, "deep", "active.json")

        await disk.writeJson(target, { a: 1 })

        await expect(disk.text(target)).resolves.toBe('{\n  "a": 1\n}\n')
        await expect(readFile(target, "utf8")).resolves.toContain('"a": 1')
    })
})
