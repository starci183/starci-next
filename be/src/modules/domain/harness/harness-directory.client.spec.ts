import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { harnessDirectory } from "./harness-directory.client"
import type { HarnessSourceReader } from "./harness-source.port"

const READER: unique symbol = Symbol("harness.directory-client")

const build = async (): Promise<HarnessSourceReader> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: READER, useFactory: () => harnessDirectory }],
    }).compile()
    return moduleRef.get<HarnessSourceReader>(READER)
}

describe("harnessDirectory", () => {
    let root = ""

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-harness-"))
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    it("says whether the checkout holds a raw harness folder", async () => {
        const reader = await build()
        await expect(reader.exists(root)).resolves.toBe(false)

        await mkdir(join(root, "raw", "harness"), { recursive: true })

        await expect(reader.exists(root)).resolves.toBe(true)
    })

    it("reads the text files below raw/harness sorted by path, leaving out node_modules, .git and binary files", async () => {
        const reader = await build()
        const base = join(root, "raw", "harness", "build", "agent-cli")
        await mkdir(join(base, "source", "node_modules", "x"), { recursive: true })
        await mkdir(join(base, "e2e"), { recursive: true })
        await writeFile(join(base, "stages.yaml"), "id: agent-cli")
        await writeFile(join(base, "e2e", "a.ts"), "export {}")
        await writeFile(join(base, "source", "node_modules", "x", "i.js"), "skipped")
        await writeFile(join(base, "source", "logo.bin"), Buffer.from([1, 0, 2]))
        await writeFile(join(root, "raw", "other.md"), "not under harness")

        const files = await reader.read(root)

        expect(files).toEqual([
            { path: "raw/harness/build/agent-cli/e2e/a.ts", text: "export {}" },
            { path: "raw/harness/build/agent-cli/stages.yaml", text: "id: agent-cli" },
        ])
    })
})
