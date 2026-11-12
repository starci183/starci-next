import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { EnvSource } from "@modules/platform/config"
import { ContentErrorCode } from "./errors/content.error"
import type { ContentGitReader } from "./content-git.port"
import { bareUrlOf, contentGitOf } from "./content-git.client"

/** The variables the real git processes of the spec need to run, read from the process environment. */
const inheritedOf = (env: EnvSource): Readonly<Record<string, string>> =>
    Object.fromEntries(
        ["PATH", "PATHEXT", "HOME", "USERPROFILE", "SYSTEMROOT", "COMSPEC", "TMPDIR", "TEMP", "TMP"].flatMap((key) => {
            const value = env.optional(key)
            return value === undefined ? [] : [[key, value] as const]
        }),
    )

const CONTENT_GIT_READER: unique symbol = Symbol("content.git-reader")

const build = async (): Promise<ContentGitReader> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            {
                provide: CONTENT_GIT_READER,
                useFactory: () => contentGitOf({ read: () => inheritedOf(EnvSource.fromProcess()) }),
            },
        ],
    }).compile()
    return moduleRef.get<ContentGitReader>(CONTENT_GIT_READER)
}

const git = (cwd: string, ...args: Array<string>): string =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
        cwd,
        encoding: "utf8",
    }).trim()

const initRepo = async (repo: string): Promise<void> => {
    await mkdir(repo)
    git(repo, "init", "--quiet", "--initial-branch=main")
    await writeFile(join(repo, "manifest.yaml"), "one")
    git(repo, "add", ".")
    git(repo, "commit", "--quiet", "-m", "first")
}

describe("contentGit materialize", () => {
    let root = ""
    let repo = ""
    let datasources = ""

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-content-git-"))
        repo = join(root, "repo")
        datasources = join(root, "datasources")
        await initRepo(repo)
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    const params = (ref: string | null) => ({
        source: "content" as const,
        config: { url: repo, ref, token: null },
        datasourcesDir: datasources,
        now: "2026-11-09T10:00:00.000Z",
    })

    it("writes a snapshot named by the commit sha with its manifest, and leaves it alone the second time", async () => {
        const sha = git(repo, "rev-parse", "HEAD")
        const contentGit = await build()

        const first = await contentGit.materialize(params(null))
        const second = await contentGit.materialize(params(null))

        expect(first).toMatchObject({
            created: true,
            snapshot: { source: "content", sha, directory: join(datasources, sha) },
        })
        expect(second.created).toBe(false)
        await expect(readFile(join(datasources, sha, "manifest.yaml"), "utf8")).resolves.toBe("one")
        const manifest = await readFile(join(datasources, sha, "manifest.json"), "utf8")
        expect(manifest).toContain('"source": "content"')
        expect(manifest).toContain('"ref": "HEAD"')
        expect(manifest).toContain(`"sha": "${sha}"`)
        expect(manifest).toContain('"fetchedAt": "2026-11-09T10:00:00.000Z"')
    })

    it("takes a new commit on the next pull, keeps the old snapshot and honours a pinned sha", async () => {
        const pinned = git(repo, "rev-parse", "HEAD")
        const contentGit = await build()
        await contentGit.materialize(params(null))
        await writeFile(join(repo, "manifest.yaml"), "two")
        git(repo, "commit", "--quiet", "-am", "second")

        const latest = await contentGit.materialize(params(null))
        const old = await contentGit.materialize(params(pinned))

        expect(latest.snapshot.sha).not.toBe(pinned)
        await expect(readFile(join(latest.snapshot.directory, "manifest.yaml"), "utf8")).resolves.toBe("two")
        expect(old).toMatchObject({ created: false, snapshot: { sha: pinned } })
    })

    it("refuses a repository it cannot clone, naming the step and never a token", async () => {
        const contentGit = await build()
        const broken = {
            ...params(null),
            config: { url: join(root, "missing"), ref: null, token: { reveal: () => "secret-token" } },
        }

        const failure = await contentGit.materialize(broken).catch((cause: unknown) => cause)

        expect(failure).toMatchObject({
            message: ContentErrorCode.PullFailed,
            params: { source: "content", step: "clone" },
        })
        expect(JSON.stringify(failure)).not.toContain("secret-token")
    })
})

describe("contentGit fingerprint", () => {
    let root = ""
    let repo = ""

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), "starci-content-git-"))
        repo = join(root, "repo")
        await initRepo(repo)
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    it("fingerprints a clean checkout by its short sha, a dirty one with a hash of the files, and any other directory as local", async () => {
        const contentGit = await build()
        const clean = await contentGit.fingerprint(repo)
        await writeFile(join(repo, "manifest.yaml"), "edited")
        await writeFile(join(repo, "extra.yaml"), "more")
        const dirty = await contentGit.fingerprint(repo)
        const plain = await mkdtemp(join(tmpdir(), "starci-content-plain-"))

        expect(clean).toBe(git(repo, "rev-parse", "--short=9", "HEAD"))
        expect(dirty).toMatch(new RegExp(`^${clean}-dirty-[0-9a-f]{8}$`, "u"))
        await expect(contentGit.fingerprint(plain)).resolves.toBe("local")
        await rm(plain, { recursive: true, force: true })
    })

    it("strips a credential from the URL kept in the manifest", () => {
        expect(bareUrlOf("https://user:pw@github.com/a/b.git")).toBe("https://github.com/a/b.git")
        expect(bareUrlOf("/local/path")).toBe("/local/path")
    })
})
