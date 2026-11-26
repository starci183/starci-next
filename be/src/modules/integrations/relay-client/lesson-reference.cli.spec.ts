import { execSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import type { LessonReference } from "@modules/platform/relay-protocol"
import { REFERENCE_STATE_FILE, refLesson, referenceFolderOf, referenceParentOf } from "./lesson-reference.cli"
import type { CliIo } from "./relay-client.contracts"
import { worldOf } from "./lesson.testing"

const SHA = "0123456789abcdef0123456789abcdef01234567"

const demo = (commit = SHA): LessonReference => ({
    name: "demo",
    lessons: ["demo-lesson"],
    repo: "starci-next/essential-demo",
    commit,
    checked: "2026-11-26",
    languages: [
        { id: "typescript", folder: "typescript", label: "TypeScript (NestJS)" },
        { id: "go", folder: "go", label: "Go" },
    ],
})

/** A tarball shaped like GitHub's: every file under `<name>-<sha>/`. */
const githubTarball = (files: Record<string, string>, root = `essential-demo-${SHA}`): Buffer => {
    const folder = mkdtempSync(join(tmpdir(), "starci-next-ref-src-"))
    Object.entries(files).forEach(([path, text]) => {
        mkdirSync(join(folder, root, path, ".."), { recursive: true })
        writeFileSync(join(folder, root, path), text)
    })
    execSync(`tar -czf pack.tgz ${root}`, { cwd: folder })
    return readFileSync(join(folder, "pack.tgz"))
}

/** A learner machine with a real shell for tar and a download that answers `bytes`; it records every download. */
const refWorld = (bytes: Buffer, status = 200) => {
    const world = worldOf({})
    const downloads: Array<{ url: string; bearer: string | undefined }> = []
    const io: CliIo = {
        ...world.io,
        download: (url, bearer) => {
            downloads.push({ url, bearer })
            return Promise.resolve({ status, bytes })
        },
        runCommand: (command, where) => {
            try {
                const output = execSync(command, { cwd: where, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
                return Promise.resolve({ exitCode: 0, output, durationMs: 1 })
            } catch (error) {
                return Promise.resolve({ exitCode: 1, output: String(error), durationMs: 1 })
            }
        },
    }
    return { world, io, downloads }
}

const FILES = { "README.md": "# demo", "typescript/README.md": "# ts", "typescript/src/a.ts": "x", "go/main.go": "package main" }

describe("refLesson", () => {
    it("downloads the pinned tarball with no token and unpacks only the language folder next to the lab, with its marker", async () => {
        const { world, io, downloads } = refWorld(githubTarball(FILES))

        expect(await refLesson(io, "demo", undefined, undefined, world.cwd, [demo()])).toBe(0)
        expect(downloads).toEqual([{ url: `https://codeload.github.com/starci-next/essential-demo/tar.gz/${SHA}`, bearer: undefined }])
        const target = join(world.cwd, "essential-demo-typescript")
        expect(readFileSync(join(target, "src", "a.ts"), "utf8")).toBe("x")
        expect(existsSync(join(target, "main.go"))).toBe(false)
        expect(existsSync(join(target, ".starci-source.tar.gz"))).toBe(false)
        expect(JSON.parse(readFileSync(join(target, REFERENCE_STATE_FILE), "utf8"))).toEqual({
            repo: "starci-next/essential-demo",
            commit: SHA,
            lang: "typescript",
        })
        expect(world.out.join("\n")).toContain(`https://github.com/starci-next/essential-demo/tree/${SHA}/typescript`)
    })

    it("takes another language folder with --lang, and answers 0 without downloading when it is already there", async () => {
        const { world, io, downloads } = refWorld(githubTarball(FILES))

        expect(await refLesson(io, "demo-lesson", "go", undefined, world.cwd, [demo()])).toBe(0)
        expect(readFileSync(join(world.cwd, "essential-demo-go", "main.go"), "utf8")).toBe("package main")
        expect(await refLesson(io, "demo", "go", undefined, world.cwd, [demo()])).toBe(0)
        expect(downloads).toHaveLength(1)
        expect(world.out.join("\n")).toContain("already here")
    })

    it("refuses an unknown lesson, an unpinned reference and a missing language before downloading", async () => {
        const { world, io, downloads } = refWorld(githubTarball(FILES))

        expect(await refLesson(io, "nope", undefined, undefined, world.cwd, [demo()])).toBe(1)
        expect(await refLesson(io, "demo", undefined, undefined, world.cwd, [demo("main")])).toBe(1)
        expect(await refLesson(io, "demo", "rust", undefined, world.cwd, [demo()])).toBe(1)
        expect(world.err.join("\n")).toContain("no rust folder")
        expect(downloads).toHaveLength(0)
    })

    it("leaves a foreign folder of the same name alone", async () => {
        const { world, io, downloads } = refWorld(githubTarball(FILES))
        mkdirSync(join(world.cwd, "essential-demo-typescript"))

        expect(await refLesson(io, "demo", undefined, undefined, world.cwd, [demo()])).toBe(1)
        expect(world.out.join("\n")).toContain("not this reference")
        expect(downloads).toHaveLength(0)
    })

    it("removes what it made when GitHub refuses, or when the tarball holds anything outside the repository root", async () => {
        const refused = refWorld(Buffer.alloc(0), 404)
        expect(await refLesson(refused.io, "demo", undefined, undefined, refused.world.cwd, [demo()])).toBe(1)
        expect(refused.world.err.join("\n")).toContain("HTTP 404")

        const foreign = refWorld(githubTarball(FILES, "elsewhere"))
        expect(await refLesson(foreign.io, "demo", undefined, undefined, foreign.world.cwd, [demo()])).toBe(1)
        expect(foreign.world.err.join("\n")).toContain("outside")
        expect(existsSync(join(foreign.world.cwd, "essential-demo-typescript"))).toBe(false)
    })
})

describe("referenceParentOf and referenceFolderOf", () => {
    it("puts the reference beside a lab, never inside it, unless --dir says where", () => {
        expect(referenceParentOf("/w/lab", undefined, () => true)).toBe(dirname("/w/lab"))
        expect(referenceParentOf("/w", undefined, () => false)).toBe("/w")
        expect(referenceParentOf("/w/lab", "refs", () => true)).toBe(resolve("/w/lab", "refs"))
        expect(referenceFolderOf(demo(), "typescript")).toBe("essential-demo-typescript")
    })
})
