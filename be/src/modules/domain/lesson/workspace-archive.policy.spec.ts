import { inflateRawSync } from "node:zlib"
import { Test } from "@nestjs/testing"
import type { LessonWorkspaceVariant } from "./lesson.contracts"
import { crc32Of, safeArchivePath, workspaceEntriesOf, zipOf } from "./workspace-archive.policy"

const ARCHIVE_POLICY: unique symbol = Symbol("lesson.workspace-archive-policy")
const policy = { crc32Of, safeArchivePath, workspaceEntriesOf, zipOf }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ARCHIVE_POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get<typeof policy>(ARCHIVE_POLICY)
}

interface Unpacked {
    path: string
    text: string
    crc: number
}

/** Reads the archive back through its central directory: the path, the stored bytes inflated and the checksum of each entry. */
const unzip = (zip: Buffer): Array<Unpacked> => {
    const end = zip.length - 22
    expect(zip.readUInt32LE(end)).toBe(0x06_05_4b_50)
    const count = zip.readUInt16LE(end + 10)
    let cursor = zip.readUInt32LE(end + 16)
    const found: Array<Unpacked> = []
    for (let index = 0; index < count; index += 1) {
        expect(zip.readUInt32LE(cursor)).toBe(0x02_01_4b_50)
        const crc = zip.readUInt32LE(cursor + 16)
        const packedSize = zip.readUInt32LE(cursor + 20)
        const nameLength = zip.readUInt16LE(cursor + 28)
        const localOffset = zip.readUInt32LE(cursor + 42)
        const path = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8")
        expect(zip.readUInt32LE(localOffset)).toBe(0x04_03_4b_50)
        const dataStart = localOffset + 30 + zip.readUInt16LE(localOffset + 26)
        const text = inflateRawSync(zip.subarray(dataStart, dataStart + packedSize)).toString("utf8")
        found.push({ path, text, crc })
        cursor += 46 + nameLength
    }
    return found
}

describe("crc32Of", () => {
    it("matches the known check value", async () => {
        const { crc32Of: crc } = await build()

        expect(crc(Buffer.from("123456789"))).toBe(0xcb_f4_39_26)
    })
})

describe("safeArchivePath", () => {
    it("keeps a relative path and turns backslashes into slashes", async () => {
        const { safeArchivePath: safe } = await build()

        expect(safe("src\\a/b.ts")).toBe("src/a/b.ts")
        expect(safe("/abs/x.ts")).toBe("abs/x.ts")
    })

    it("refuses a path that climbs out or names a drive", async () => {
        const { safeArchivePath: safe } = await build()

        expect(safe("../x")).toBeNull()
        expect(safe("a/../../x")).toBeNull()
        expect(safe("C:/x")).toBeNull()
        expect(safe("")).toBeNull()
    })
})

describe("zipOf", () => {
    it("packs the files so that they unpack to the same text, with UTF-8 names", async () => {
        const { zipOf: zip, crc32Of: crc } = await build()
        const name = "src/D\u1ecbch v\u1ee5.ts"
        const text = "export const a = '\u00e9'\n"

        const entries = unzip(
            zip([
                { path: name, content: text },
                { path: "README.md", content: "# hi" },
            ]),
        )

        expect(entries.map((entry) => entry.path)).toEqual([name, "README.md"])
        expect(entries.map((entry) => entry.text)).toEqual([text, "# hi"])
        expect(entries.map((entry) => entry.crc)).toEqual(entries.map((entry) => crc(Buffer.from(entry.text))))
    })

    it("drops an unsafe path and a repeated path, and is deterministic", async () => {
        const { zipOf: zip } = await build()
        const entries = [
            { path: "../evil", content: "x" },
            { path: "a.txt", content: "first" },
            { path: "a.txt", content: "second" },
        ]

        expect(unzip(zip(entries)).map((entry) => entry.text)).toEqual(["first"])
        expect(zip(entries).equals(zip(entries))).toBe(true)
    })

    it("writes an empty but valid archive", async () => {
        const { zipOf: zip } = await build()

        expect(unzip(zip([]))).toEqual([])
    })
})

describe("workspaceEntriesOf", () => {
    const variant: LessonWorkspaceVariant = {
        language: "typescript",
        runtime: "node 22",
        files: [{ path: "src/a.ts", role: "source", content: "A" }],
        commands: { windows: "npm test", unix: "npm test" },
    }

    it("lists the files then a README with the commands", async () => {
        const { workspaceEntriesOf: entriesOf } = await build()

        const entries = entriesOf(variant)

        expect(entries.map((entry) => entry.path)).toEqual(["src/a.ts", "README.md"])
        expect(entries[1]?.content).toContain("How to run the tests")
        expect(entries[1]?.content).toContain("npm test")
    })
})
