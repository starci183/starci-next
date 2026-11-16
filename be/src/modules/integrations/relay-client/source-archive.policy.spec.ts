import { archiveRefusal, hashHolds } from "./source-archive.policy"

describe("hashHolds", () => {
    it("holds for the sha256 of the bytes and only that", () => {
        const bytes = Buffer.from("abc")

        expect(hashHolds(bytes, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")).toBe(true)
        expect(hashHolds(bytes, "0".repeat(64))).toBe(false)
    })
})

describe("archiveRefusal", () => {
    const ok = "typescript/package.json\ntypescript/src/a.ts\n"
    const types = "-rw-r--r-- 0 u g 10 Nov 17 10:00 typescript/package.json\n"

    it("allows plain files and folders", () => {
        expect(archiveRefusal(ok, types)).toBeNull()
        expect(
            archiveRefusal("./a/\n./a/b.ts\n", "drwxr-xr-x 0 u g 0 x y z a/\n-rw-r--r-- 0 u g 1 x y z a/b.ts"),
        ).toBeNull()
    })

    it.each([
        ["an empty tarball", "", ""],
        ["an absolute path", "/etc/passwd\n", types],
        ["a drive path", "C:/x\n", types],
        ["a path above the folder", "a/../../x\n", types],
        ["a backslash path", "a\\b\n", types],
        ["a hidden folder", "hidden/h1.spec.ts\n", types],
        ["a hidden folder after ./", "./hidden/h1.spec.ts\n", types],
        ["a symlink", ok, "lrwxrwxrwx 0 u g 0 x y z a -> /etc"],
        ["a hard link", ok, "hrw-r--r-- 0 u g 0 x y z a link to b"],
    ])("refuses %s", (_name, names, kinds) => {
        expect(archiveRefusal(names, kinds)).not.toBeNull()
    })

    it("does not refuse a folder merely named like hidden deeper down", () => {
        expect(archiveRefusal("typescript/hidden-notes.md\n", types)).toBeNull()
    })
})
