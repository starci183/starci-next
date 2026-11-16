import { createHash, generateKeyPairSync } from "node:crypto"
import { execSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { composeLesson, promptLesson, pullLesson, runLesson } from "./lesson.cli"
import type { CliIo } from "./relay-client.contracts"
import { COMMIT, REPORT_GREEN, REPORT_RED, lessonBody, pulled, scenario, uploads, worldOf } from "./lesson.testing"

describe("pullLesson", () => {
    it("refuses any language but typescript before asking StarCi", async () => {
        const world = worldOf(lessonBody())

        expect(await pullLesson(world.io, "outbox", "java", world.cwd)).toBe(1)
        expect(world.err[0]).toContain("typescript only")
        expect(world.sent).toHaveLength(0)
    })

    /** A source folder packed the way the server packs it: `tar -czf` of the contents of `source/`, relative names. */
    const packed = (files: Record<string, string>): Buffer => {
        const folder = mkdtempSync(join(tmpdir(), "starci-next-src-"))
        Object.entries(files).forEach(([path, text]) => {
            mkdirSync(join(folder, path, ".."), { recursive: true })
            writeFileSync(join(folder, path), text)
        })
        execSync("tar -czf ../pack.tgz .", { cwd: folder })
        return readFileSync(join(folder, "..", "pack.tgz"))
    }

    /** The world of a pull: a real shell for tar and git, and a download that answers `bytes` whatever the url. */
    const pullWorld = (bytes: Buffer, sha256 = createHash("sha256").update(bytes).digest("hex")) => {
        const world = worldOf(
            lessonBody({ source: { url: "https://files.test/outbox.tgz", sha256, commit: COMMIT }, dir: "typescript" }),
        )
        const downloads: Array<{ url: string; bearer: string | undefined }> = []
        const io: CliIo = {
            ...world.io,
            download: (url, bearer) => {
                downloads.push({ url, bearer })
                return Promise.resolve({ status: 200, bytes })
            },
            runCommand: (command, where) => {
                try {
                    const output = execSync(command, {
                        cwd: where,
                        encoding: "utf8",
                        stdio: ["ignore", "pipe", "pipe"],
                    })
                    return Promise.resolve({ exitCode: 0, output, durationMs: 1 })
                } catch (error) {
                    return Promise.resolve({ exitCode: 1, output: String(error), durationMs: 1 })
                }
            },
        }
        return { world, io, downloads }
    }

    it("downloads the tarball, verifies it, unpacks it and makes one initial commit with the marker kept out of git", async () => {
        const { world, io, downloads } = pullWorld(
            packed({ "typescript/package.json": "{}", "typescript/src/a.ts": "x" }),
        )

        expect(await pullLesson(io, "outbox", "typescript", world.cwd)).toBe(0)

        const target = join(world.cwd, "outbox")
        expect(downloads).toEqual([{ url: "https://files.test/outbox.tgz", bearer: undefined }])
        expect(existsSync(join(target, "typescript", "src", "a.ts"))).toBe(true)
        expect(existsSync(join(target, ".starci-source.tar.gz"))).toBe(false)
        expect(execSync("git rev-list --count HEAD", { cwd: target, encoding: "utf8" }).trim()).toBe("1")
        expect(execSync("git status --porcelain", { cwd: target, encoding: "utf8" }).trim()).toBe("")
        expect(execSync("git ls-files", { cwd: target, encoding: "utf8" })).not.toContain(".starci-lesson.json")
        expect(JSON.parse(readFileSync(join(target, ".starci-lesson.json"), "utf8"))).toMatchObject({ commit: COMMIT })
    })

    it("is a no-op for a source already pulled and refuses a different one in the way", async () => {
        const first = pullWorld(packed({ "typescript/a.ts": "x" }))
        await pullLesson(first.io, "outbox", "typescript", first.world.cwd)

        expect(await pullLesson(first.io, "outbox", "typescript", first.world.cwd)).toBe(0)
        expect(first.downloads).toHaveLength(1)

        const other = pullWorld(packed({ "typescript/b.ts": "y" }))
        mkdirSync(join(other.world.cwd, "outbox"))
        expect(await pullLesson(other.io, "outbox", "typescript", other.world.cwd)).toBe(1)
        expect(other.downloads).toHaveLength(0)
    })

    it("sends StarCi's bearer only when the source is a path on StarCi's own origin", async () => {
        const { world, io, downloads } = pullWorld(packed({ "typescript/a.ts": "x" }))
        const bytes = packed({ "typescript/a.ts": "x" })
        const own = worldOf(
            lessonBody({
                source: {
                    url: "/api/relay/lessons/outbox/source.tgz",
                    sha256: createHash("sha256").update(bytes).digest("hex"),
                    commit: COMMIT,
                },
                dir: "typescript",
            }),
        )
        const seen: Array<{ url: string; bearer: string | undefined }> = []
        await pullLesson(
            {
                ...io,
                ...own.io,
                download: (url, bearer) => (seen.push({ url, bearer }), Promise.resolve({ status: 200, bytes })),
                runCommand: io.runCommand,
            },
            "outbox",
            undefined,
            own.cwd,
        )

        expect(seen).toEqual([{ url: "https://app.test/api/relay/lessons/outbox/source.tgz", bearer: "t".repeat(43) }])
        expect(downloads).toHaveLength(0)
        expect(world.cwd).not.toBe(own.cwd)
    })

    it("refuses bytes that do not match the signed sha256 and leaves nothing behind", async () => {
        const { world, io } = pullWorld(packed({ "typescript/a.ts": "x" }), "0".repeat(64))

        expect(await pullLesson(io, "outbox", "typescript", world.cwd)).toBe(1)
        expect(world.err.join("\n")).toContain("sha256")
        expect(existsSync(join(world.cwd, "outbox"))).toBe(false)
    })

    it("refuses a tarball carrying hidden/ even when its hash is signed, and removes the folder", async () => {
        const { world, io } = pullWorld(packed({ "typescript/a.ts": "x", "hidden/h1.spec.ts": "secret" }))

        expect(await pullLesson(io, "outbox", "typescript", world.cwd)).toBe(1)
        expect(world.err.join("\n")).toContain("not allowed")
        expect(existsSync(join(world.cwd, "outbox"))).toBe(false)
    })

    it("refuses a source without the signed project folder", async () => {
        const { world, io } = pullWorld(packed({ "other/a.ts": "x" }))

        expect(await pullLesson(io, "outbox", "typescript", world.cwd)).toBe(1)
        expect(existsSync(join(world.cwd, "outbox"))).toBe(false)
    })
})

describe("composeLesson", () => {
    it("composes up from the stored values only", async () => {
        const world = worldOf(lessonBody())
        const root = pulled(world)

        expect(await composeLesson(world.io, "up", root)).toBe(0)
        expect(world.commands[0]?.command).toBe("docker compose -p outbox -f .docker/docker-compose.yml up -d --wait")
    })
})

describe("runLesson", () => {
    it("runs the signed scenario command with a guard off, prints the why on red and uploads one result", async () => {
        const world = worldOf(lessonBody(), () => ({ report: REPORT_RED, exitCode: 1 }))
        const root = pulled(world)

        const code = await runLesson(
            world.io,
            "outbox",
            { scenario: "dup-submit", guards: ["idempotency-key=off"], yes: true },
            false,
            root,
        )

        expect(code).toBe(1)
        expect(world.commands[0]).toMatchObject({
            command: "npm test -- --scenario dup-submit",
            env: { GUARD_IDEMPOTENCY_KEY: "off" },
        })
        expect(world.out.join("\n")).toContain('Why wrong: invariant "One command, one effect"')
        const result = uploads(world).find((upload) => upload.input.slot === "scenario")
        expect(result?.input).toMatchObject({
            checkId: "dup-submit",
            passed: false,
            guardsOff: ["idempotency-key"],
            concepts: ["idempotency"],
            lessonId: "outbox",
            commit: COMMIT,
        })
        expect(JSON.parse(readFileSync(join(root, ".starci-last", "dup-submit.json"), "utf8"))).toMatchObject({
            passed: false,
            invariantIds: ["idempotency-key"],
        })
    })

    it("refuses a guard the manifest does not list and runs nothing", async () => {
        const world = worldOf(lessonBody(), () => ({ report: REPORT_GREEN }))
        const root = pulled(world)

        expect(
            await runLesson(world.io, "outbox", { scenario: "dup-submit", guards: ["x=off"], yes: true }, false, root),
        ).toBe(1)
        expect(world.commands).toHaveLength(0)
    })

    it("refuses an unsigned manifest", async () => {
        const world = worldOf(lessonBody())
        const root = pulled(world)
        const wrong = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" }).toString()

        const code = await runLesson(
            { ...world.io, env: { ...world.io.env, STARCI_NEXT_MANIFEST_KEY: wrong } },
            "outbox",
            { scenario: "dup-submit", guards: [], yes: true },
            false,
            root,
        )

        expect(code).toBe(1)
        expect(world.commands).toHaveLength(0)
    })

    it("checks every scenario when none is named and passes on green", async () => {
        const world = worldOf(lessonBody(), () => ({ report: REPORT_GREEN }))
        const root = pulled(world)

        expect(await runLesson(world.io, "outbox", { guards: [], yes: true }, true, root)).toBe(0)
        expect(uploads(world).find((upload) => upload.input.slot === "scenario")?.input.passed).toBe(true)
    })

    it("runs hidden challenge files only while they run and leaves none on disk", async () => {
        const hidden = scenario({
            id: "h1",
            files: [{ path: "tests/hidden/h1.spec.ts", contentBase64: Buffer.from("secret").toString("base64") }],
        })
        const seen: Array<boolean> = []
        const world = worldOf(lessonBody({ challenge: { tier: "easy", scenarios: [hidden] } }), (where) => {
            seen.push(existsSync(join(where, "tests", "hidden", "h1.spec.ts")))
            return { report: REPORT_GREEN.replace("dup-submit", "h1") }
        })
        const root = pulled(world)

        const code = await runLesson(world.io, "outbox", { challenge: "easy", guards: [], yes: true }, false, root)

        expect(code).toBe(0)
        expect(seen).toEqual([true])
        expect(existsSync(join(root, "tests"))).toBe(false)
        expect(existsSync(join(root, ".starci-last"))).toBe(false)
        expect(world.out.join("\n")).not.toContain("npm test")
        expect(uploads(world).find((upload) => upload.input.slot === "scenario")?.input).toMatchObject({
            challengeTier: "easy",
        })
    })

    it("wipes the hidden files even when the command throws", async () => {
        const hidden = scenario({ files: [{ path: "h.spec.ts", contentBase64: "aGk=" }] })
        const world = worldOf(lessonBody({ challenge: { tier: "easy", scenarios: [hidden] } }), () => {
            throw new Error("boom")
        })
        const root = pulled(world)

        await expect(
            runLesson(world.io, "outbox", { challenge: "easy", guards: [], yes: true }, false, root),
        ).rejects.toThrow("boom")
        expect(existsSync(join(root, "h.spec.ts"))).toBe(false)
    })

    it("refuses a hidden file that would overwrite the learner's file", async () => {
        const hidden = scenario({ files: [{ path: "mine.ts", contentBase64: "aGk=" }] })
        const world = worldOf(lessonBody({ challenge: { tier: "easy", scenarios: [hidden] } }))
        const root = pulled(world)
        writeFileSync(join(root, "mine.ts"), "mine")

        expect(await runLesson(world.io, "outbox", { challenge: "easy", guards: [], yes: true }, false, root)).toBe(1)
        expect(readFileSync(join(root, "mine.ts"), "utf8")).toBe("mine")
    })
})

describe("promptLesson", () => {
    it("asks to run first, then prints a prompt with the revealed invariant after a red run", async () => {
        const world = worldOf(lessonBody(), () => ({ report: REPORT_RED, exitCode: 1 }))
        const root = pulled(world)

        expect(await promptLesson(world.io, "outbox", "dup-submit", root)).toBe(1)
        expect(world.err.join("\n")).toContain("Run it first")

        await runLesson(world.io, "outbox", { scenario: "dup-submit", guards: [], yes: true }, false, root)
        world.out.length = 0
        expect(await promptLesson(world.io, "outbox", "dup-submit", root)).toBe(0)

        const text = world.out.join("\n")
        expect(text).toContain("One command, one effect (idempotency-key)")
        expect(text).toContain("Send the same command twice.")
    })
})
