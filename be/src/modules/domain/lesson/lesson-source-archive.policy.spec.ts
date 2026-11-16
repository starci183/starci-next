import { createHash } from "node:crypto"
import { gunzipSync } from "node:zlib"
import type { LessonSourceFile } from "./lesson-import.contracts"
import { sourceArchiveOf, sourceCodeOf } from "./lesson-source-archive.policy"

/** A file of a lesson folder as the directory reader answers it. */
const fileOf = (path: string, text: string): LessonSourceFile => ({
    path,
    text,
    sha256: createHash("sha256").update(text).digest("hex"),
})

/** The entry names of a ustar archive, read block by block. */
const namesOf = (tar: Buffer): Array<string> => {
    const names: Array<string> = []
    let offset = 0
    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512)
        if (header.every((byte) => byte === 0)) break
        const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/su, "")
        const prefix = header.subarray(345, 500).toString("utf8").replace(/\0.*$/su, "")
        const size = Number.parseInt(header.subarray(124, 136).toString("ascii").replace(/\0.*$/su, ""), 8)
        names.push(prefix === "" ? name : `${prefix}/${name}`)
        offset += 512 + Math.ceil(size / 512) * 512
    }
    return names
}

/** A lesson folder with its root files, its source, and the hidden challenge tests beside it. */
const FOLDER: ReadonlyArray<LessonSourceFile> = [
    fileOf("vi.md", "# title"),
    fileOf("en.md", "# title"),
    fileOf("sections/0-interview/vi.md", "# title"),
    fileOf("source/package.json", '{"name":"outbox"}'),
    fileOf("source/src/outbox.ts", "export const outbox = 1\n"),
    fileOf("source/.docker/docker-compose.yml", "services: {}\n"),
    fileOf("hidden/h-easy-1.spec.ts", "// the hidden test: never in the tarball\n"),
    fileOf("hidden/source/trap.ts", "// a hidden file under a folder named source\n"),
    fileOf("sources/near-miss.ts", "// not the source folder\n"),
    fileOf("source/.git/config", "[core]\n"),
]

describe("lesson source archive", () => {
    it("takes only the files under source/, with their paths relative to it", () => {
        expect(sourceCodeOf(FOLDER).map((file) => file.path)).toEqual([
            ".docker/docker-compose.yml",
            "package.json",
            "src/outbox.ts",
        ])
    })

    it("holds the contents of source/ with no prefix and never a file of hidden/ (or anything outside source/)", () => {
        const archive = sourceArchiveOf(sourceCodeOf(FOLDER))
        const tar = gunzipSync(archive.content)
        const names = namesOf(tar)
        expect(names).toEqual([".docker/docker-compose.yml", "package.json", "src/outbox.ts"])
        expect(names.some((name) => name.split("/")[0] === "hidden" || name.startsWith("source/"))).toBe(false)
        expect(tar.includes(Buffer.from("hidden"))).toBe(false)
        expect(tar.includes(Buffer.from("the hidden test"))).toBe(false)
    })

    it("answers the same bytes and SHA-256 for the same files, the one the manifest signs", () => {
        const first = sourceArchiveOf(sourceCodeOf(FOLDER))
        const again = sourceArchiveOf(sourceCodeOf([...FOLDER].reverse()))
        expect(again.content.equals(first.content)).toBe(true)
        expect(first.sha256).toBe(createHash("sha256").update(first.content).digest("hex"))
    })

    it("answers no source for a lesson folder without source/", () => {
        expect(sourceCodeOf(FOLDER.filter((file) => !file.path.startsWith("source/")))).toEqual([])
    })
})
