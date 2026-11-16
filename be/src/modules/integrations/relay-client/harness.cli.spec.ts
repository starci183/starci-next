import { createHash, createHmac } from "node:crypto"
import { execSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { ciReportBuild, e2eBuild, pullBuild } from "./harness.cli"
import { HARNESS_STATE_FILE } from "./harness-files.adapter"
import type { CliIo, FetchInit } from "./relay-client.contracts"
import { COMMIT, uploads, worldOf, type World } from "./lesson.testing"

const SECRET_VALUE = "sk-ant-this-must-never-travel"

const buildBody = (extra: Record<string, unknown> = {}) => ({
    kind: "build",
    buildId: "agent-cli",
    source: { url: "/relay/harness/build/agent-cli/source.tgz", sha256: "d".repeat(64), commit: COMMIT },
    dir: "source",
    install: "npm ci",
    e2e: "npm run e2e",
    report: "e2e/reports/junit.xml",
    keys: [{ id: "llm", anyOf: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] }],
    stages: [
        { id: "s1-loop", e2e: ["loop-calls-tool", "loop-stops"] },
        { id: "s2-tools", e2e: ["tool-schema"] },
    ],
    ...extra,
})

const REPORT = `<testsuites>
  <testcase name="[s1-loop:loop-calls-tool] calls a tool" time="0.5"/>
  <testcase name="[s1-loop:loop-stops] stops" time="0.1"/>
  <testcase name="[s2-tools:tool-schema] schema" time="0.2"><failure message="${SECRET_VALUE} leaked in a message">x</failure></testcase>
</testsuites>`

const packed = (files: Record<string, string>): Buffer => {
    const folder = mkdtempSync(join(tmpdir(), "starci-next-hsrc-"))
    Object.entries(files).forEach(([path, text]) => {
        mkdirSync(join(folder, path, ".."), { recursive: true })
        writeFileSync(join(folder, path), text)
    })
    execSync("tar -czf ../hpack.tgz .", { cwd: folder })
    return readFileSync(join(folder, "..", "hpack.tgz"))
}

/** A learner machine with a paired device and a fake StarCi that signs a build; shell commands are real for pull, faked for the e2e. */
const harnessWorld = (
    section: unknown,
    e2e: (cwd: string, command: string) => { report?: string; exitCode?: number } = () => ({ report: REPORT }),
) => {
    const ran: Array<{ command: string; cwd: string; env: Readonly<Record<string, string>> | undefined }> = []
    const world: World = worldOf(section, () => ({}), "harness")
    const io: CliIo = {
        ...world.io,
        hasEnv: () => false,
        runCommand: (command, cwd, _timeoutMs, env) => {
            if (/^(tar|git) /u.test(command)) {
                try {
                    const output = execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
                    return Promise.resolve({ exitCode: 0, output, durationMs: 1 })
                } catch (error) {
                    return Promise.resolve({ exitCode: 1, output: String(error), durationMs: 1 })
                }
            }
            ran.push({ command, cwd, env })
            const made = e2e(cwd, command)
            if (made.report !== undefined) {
                const reportPath = join(cwd, "..", "e2e", "reports", "junit.xml")
                mkdirSync(join(reportPath, ".."), { recursive: true })
                writeFileSync(reportPath, made.report)
            }
            return Promise.resolve({ exitCode: made.exitCode ?? 0, output: `ran ${SECRET_VALUE}`, durationMs: 5 })
        },
    }
    return { world, io, ran }
}

/** The folder `harness pull` leaves, made by hand, with a `.env` holding a real-looking key. */
const pulledBuild = (world: World, plan: Record<string, unknown> = buildBody()): string => {
    const root = join(world.cwd, "agent-cli")
    mkdirSync(join(root, "source"), { recursive: true })
    const { kind: _kind, source: _source, ...rest } = plan
    writeFileSync(
        join(root, HARNESS_STATE_FILE),
        JSON.stringify({ ...rest, commit: COMMIT, sha256: "d".repeat(64) }),
    )
    writeFileSync(join(root, ".env"), `ANTHROPIC_API_KEY=${SECRET_VALUE}\nOTHER=1\n`)
    return root
}

const everythingSeen = (world: World): string => JSON.stringify([world.out, world.err, world.sent])

describe("harness pull", () => {
    const source = packed({ "source/package.json": "{}", "source/src/a.ts": "x", "e2e/loop.e2e.ts": "y", ".gitignore": "node_modules\n" })
    const pullWorld = (bytes: Buffer, sha256 = createHash("sha256").update(bytes).digest("hex")) => {
        const made = harnessWorld(buildBody({ source: { url: "/relay/harness/build/agent-cli/source.tgz", sha256, commit: COMMIT } }))
        const downloads: Array<{ url: string; bearer: string | undefined }> = []
        const io: CliIo = {
            ...made.io,
            download: (url, bearer) => {
                downloads.push({ url, bearer })
                return Promise.resolve({ status: 200, bytes })
            },
        }
        return { world: made.world, io, downloads }
    }

    it("downloads the signed tarball from StarCi with the device token, unpacks it and commits once with .env ignored and the plan tracked", async () => {
        const { world, io, downloads } = pullWorld(source)

        expect(await pullBuild(io, "agent-cli", world.cwd)).toBe(0)

        const target = join(world.cwd, "agent-cli")
        expect(downloads).toEqual([
            { url: "https://app.test/relay/harness/build/agent-cli/source.tgz", bearer: "t".repeat(43) },
        ])
        expect(existsSync(join(target, "source", "src", "a.ts"))).toBe(true)
        expect(existsSync(join(target, "e2e", "loop.e2e.ts"))).toBe(true)
        expect(readFileSync(join(target, ".gitignore"), "utf8")).toBe("node_modules\n.env\n")
        expect(readFileSync(join(target, ".git", "info", "exclude"), "utf8")).toContain(".env\n")
        expect(execSync("git rev-list --count HEAD", { cwd: target, encoding: "utf8" }).trim()).toBe("1")
        expect(execSync("git status --porcelain", { cwd: target, encoding: "utf8" }).trim()).toBe("")
        expect(execSync("git ls-files", { cwd: target, encoding: "utf8" })).toContain(HARNESS_STATE_FILE)
        const state = JSON.parse(readFileSync(join(target, HARNESS_STATE_FILE), "utf8")) as Record<string, unknown>
        expect(state).toMatchObject({ buildId: "agent-cli", commit: COMMIT, e2e: "npm run e2e", dir: "source" })
        expect(JSON.stringify(state)).not.toContain("https://")
        expect(world.out.join("\n")).toContain("ANTHROPIC_API_KEY, OPENAI_API_KEY")
    })

    it("leaves a .gitignore that already ignores .env alone and creates one when there is none", async () => {
        const { world, io } = pullWorld(packed({ "source/a.ts": "x", ".gitignore": ".env\n" }))
        await pullBuild(io, "agent-cli", world.cwd)
        expect(readFileSync(join(world.cwd, "agent-cli", ".gitignore"), "utf8")).toBe(".env\n")

        const bare = pullWorld(packed({ "source/a.ts": "x" }))
        await pullBuild(bare.io, "agent-cli", bare.world.cwd)
        expect(readFileSync(join(bare.world.cwd, "agent-cli", ".gitignore"), "utf8")).toBe(".env\n")
    })

    it("answers already pulled for the same source and refuses a different folder in the way", async () => {
        const first = pullWorld(source)
        await pullBuild(first.io, "agent-cli", first.world.cwd)
        expect(await pullBuild(first.io, "agent-cli", first.world.cwd)).toBe(0)
        expect(first.downloads).toHaveLength(1)

        const other = pullWorld(source)
        mkdirSync(join(other.world.cwd, "agent-cli"))
        expect(await pullBuild(other.io, "agent-cli", other.world.cwd)).toBe(1)
        expect(other.world.out.join("\n")).toContain("is not this source")
    })

    it("refuses bytes that do not match the signed sha256, or a path from hidden/, and leaves nothing behind", async () => {
        const wrong = pullWorld(source, "0".repeat(64))
        expect(await pullBuild(wrong.io, "agent-cli", wrong.world.cwd)).toBe(1)
        expect(existsSync(join(wrong.world.cwd, "agent-cli"))).toBe(false)

        const hidden = pullWorld(packed({ "source/a.ts": "x", "hidden/answer.ts": "z" }))
        expect(await pullBuild(hidden.io, "agent-cli", hidden.world.cwd)).toBe(1)
        expect(hidden.world.err.join("\n")).toContain("hidden")
        expect(existsSync(join(hidden.world.cwd, "agent-cli"))).toBe(false)
    })

    it("refuses a manifest that is a doctor section, not a build, and a bad build id", async () => {
        const made = harnessWorld({ kind: "doctor", tool: "claude", source: { url: "/x.tgz", sha256: "e".repeat(64), commit: "a".repeat(40) } })
        expect(await pullBuild(made.io, "agent-cli", made.world.cwd)).toBe(1)
        expect(made.world.err.join("\n")).toContain("no build")
        expect(await pullBuild(made.io, "Agent CLI", made.world.cwd)).toBe(1)
    })
})

describe("harness e2e", () => {
    it("runs the signed command once, prints a stage table and uploads one harness-stage result per e2e id with key NAMES only", async () => {
        const { world, io, ran } = harnessWorld(buildBody())
        pulledBuild(world)

        const code = await e2eBuild(io, undefined, { install: false, yes: true }, join(world.cwd, "agent-cli"))

        expect(code).toBe(1)
        expect(ran).toHaveLength(1)
        expect(ran[0]).toMatchObject({ command: "npm run e2e", env: { STARCI_STAGE: "" } })
        expect(ran[0]?.cwd).toBe(join(world.cwd, "agent-cli", "source"))
        const out = world.out.join("\n")
        expect(out).toMatch(/1\s+s1-loop\s+2\s+2\s+0\s+0\.6s\s+PASS/u)
        expect(out).toMatch(/2\s+s2-tools\s+1\s+0\s+1\s+0\.2s\s+FAIL/u)
        expect(out).toContain("Keys present (names only): ANTHROPIC_API_KEY.")
        const results = uploads(world).filter((item) => item.query.includes("relayCheckResult"))
        expect(results.map((item) => item.input)).toEqual([
            expect.objectContaining({
                taskId: "harness:build:agent-cli",
                checkId: "s1-loop",
                slot: "harness-stage",
                ref: "loop-calls-tool",
                passed: true,
                exitCode: 0,
                commit: COMMIT,
                buildId: "agent-cli",
                stageId: "s1-loop",
                durationMs: 500,
                envPresent: ["ANTHROPIC_API_KEY"],
            }),
            expect.objectContaining({ ref: "loop-stops", passed: true }),
            expect.objectContaining({ checkId: "s2-tools", ref: "tool-schema", passed: false, why: "failed" }),
        ])
        expect(uploads(world).filter((item) => item.query.includes("relayCheckStarted"))).toHaveLength(2)
        expect(world.sent.filter((body) => body.query.includes("relayManifestAck"))).toHaveLength(1)
        const logs = uploads(world).filter((item) => item.query.includes("relayLog"))
        expect(logs.map((item) => item.input.text)).toEqual(["2/2 e2e passed in stage s1-loop", "0/1 e2e passed in stage s2-tools"])
    })

    it("never lets a key value or a test message reach an upload, a printed line or an error", async () => {
        const { world, io } = harnessWorld(buildBody())
        pulledBuild(world)

        await e2eBuild(io, "agent-cli", { install: false, yes: true }, world.cwd)

        expect(everythingSeen(world)).not.toContain(SECRET_VALUE)
        expect(everythingSeen(world)).not.toContain("leaked")
    })

    it("runs one stage by its number with STARCI_STAGE set to its id and reports only that stage", async () => {
        const { world, io, ran } = harnessWorld(buildBody())
        pulledBuild(world)

        const code = await e2eBuild(io, "agent-cli", { stage: "1", install: false, yes: true }, world.cwd)

        expect(code).toBe(0)
        expect(ran[0]?.env).toEqual({ STARCI_STAGE: "s1-loop" })
        expect(uploads(world).filter((item) => item.query.includes("relayCheckResult"))).toHaveLength(2)
        expect(world.out.join("\n")).toContain("1/1 stage(s) passed")
    })

    it("refuses a stage that does not exist before running anything", async () => {
        const { world, io, ran } = harnessWorld(buildBody())
        pulledBuild(world)

        expect(await e2eBuild(io, "agent-cli", { stage: "9", install: false, yes: true }, world.cwd)).toBe(1)
        expect(ran).toHaveLength(0)
        expect(uploads(world)).toHaveLength(0)
    })

    it("names a missing key by variable name and still runs; an e2e with no tagged test is reported not run", async () => {
        const { world, io } = harnessWorld(buildBody(), () => ({ report: `<testsuites><testcase name="[s1-loop:loop-stops] ok"/></testsuites>` }))
        const root = pulledBuild(world)
        writeFileSync(join(root, ".env"), "UNRELATED=1\n")

        await e2eBuild(io, "agent-cli", { install: false, yes: true }, world.cwd)

        expect(world.out.join("\n")).toContain("none of ANTHROPIC_API_KEY, OPENAI_API_KEY is set")
        const results = uploads(world).filter((item) => item.query.includes("relayCheckResult"))
        expect(results.find((item) => item.input.ref === "loop-calls-tool")?.input).toMatchObject({
            passed: false,
            why: "not run: no test carries its tag",
            envPresent: [],
        })
    })

    it("counts a key set in the environment, and runs install first only when asked", async () => {
        const { world, io, ran } = harnessWorld(buildBody())
        const root = pulledBuild(world)
        writeFileSync(join(root, ".env"), "")

        await e2eBuild({ ...io, hasEnv: (name) => name === "OPENAI_API_KEY" }, "agent-cli", { install: true, yes: true }, world.cwd)

        expect(ran.map((item) => item.command)).toEqual(["npm ci", "npm run e2e"])
        expect(uploads(world).find((item) => item.query.includes("relayCheckResult"))?.input.envPresent).toEqual(["OPENAI_API_KEY"])
    })

    it("stops without a run when the install fails, and runs nothing when the learner says no", async () => {
        const failing = harnessWorld(buildBody(), (_cwd, command) => ({ exitCode: command === "npm ci" ? 7 : 0 }))
        pulledBuild(failing.world)
        expect(await e2eBuild(failing.io, "agent-cli", { install: true, yes: true }, failing.world.cwd)).toBe(1)
        expect(failing.ran.map((item) => item.command)).toEqual(["npm ci"])

        const declined = harnessWorld(buildBody())
        pulledBuild(declined.world)
        const io = { ...declined.io, confirm: () => Promise.resolve(false) }
        expect(await e2eBuild(io, "agent-cli", { install: false, yes: false }, declined.world.cwd)).toBe(0)
        expect(declined.ran).toHaveLength(0)
        expect(declined.world.out.join("\n")).toContain("Nothing was run.")
    })

    it("refuses an unsigned manifest, a build the folder is not, and a folder with no build", async () => {
        const { world, io, ran } = harnessWorld(buildBody({ buildId: "other-build" }))
        pulledBuild(world)
        expect(await e2eBuild(io, "agent-cli", { install: false, yes: true }, world.cwd)).toBe(1)
        expect(world.err.join("\n")).toContain("no build")
        expect(ran).toHaveLength(0)

        const empty = harnessWorld(buildBody())
        expect(await e2eBuild(empty.io, undefined, { install: false, yes: true }, empty.world.cwd)).toBe(1)
        expect(empty.world.err.join("\n")).toContain("harness pull")
        expect(
            await e2eBuild({ ...empty.io, verify: () => ({ kind: "rejected", cause: "signature" }) }, "agent-cli", { install: false, yes: true }, empty.world.cwd),
        ).toBe(1)
    })
})

describe("harness ci-report", () => {
    const CI = {
        STARCI_API_URL: "https://starci.test/",
        STARCI_PROJECT_ID: "11111111-2222-3333-4444-555555555555",
        STARCI_CI_SECRET: "project-secret-value",
        GITHUB_RUN_ID: "9001",
        GITHUB_RUN_ATTEMPT: "2",
        GITHUB_SHA: "ABCDEF0123456789ABCDEF0123456789ABCDEF01",
        ACTIONS_ID_TOKEN_REQUEST_URL: "https://actions.test/token?api=1",
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-bearer",
    } as Record<string, string | undefined>

    const ciWorld = (env: Record<string, string | undefined> = CI, status = 200, oidcStatus = 200) => {
        const made = harnessWorld(buildBody())
        const root = pulledBuild(made.world)
        mkdirSync(join(root, "e2e", "reports"), { recursive: true })
        writeFileSync(join(root, "e2e", "reports", "junit.xml"), REPORT)
        const posts: Array<{ url: string; init: FetchInit }> = []
        const downloads: Array<{ url: string; bearer: string | undefined }> = []
        const io: CliIo = {
            ...made.io,
            ciEnv: (name) => env[name],
            fetch: (url, init) => (posts.push({ url, init }), Promise.resolve({ status, text: '{"received":true}' })),
            download: (url, bearer) => {
                downloads.push({ url, bearer })
                return Promise.resolve({ status: oidcStatus, bytes: Buffer.from(JSON.stringify({ value: "oidc.jwt.token" })) })
            },
        }
        return { world: made.world, io, root, posts, downloads }
    }

    it("posts the harness lines to the project-ci door, HMAC-signed with the project secret and attested with the OIDC token", async () => {
        const { world, io, root, posts, downloads } = ciWorld()

        expect(await ciReportBuild(io, {}, root)).toBe(0)

        expect(downloads).toEqual([
            { url: "https://actions.test/token?api=1&audience=starci-next", bearer: "request-bearer" },
        ])
        expect(posts).toHaveLength(1)
        const [{ url, init }] = posts as [(typeof posts)[number]]
        expect(url).toBe("https://starci.test/webhooks/project-ci")
        expect(JSON.parse(init.body)).toEqual({
            runId: "9001-2",
            commit: "abcdef0123456789abcdef0123456789abcdef01",
            passed: false,
            results: [],
            harness: [
                { build: "agent-cli", stage: "s1-loop", e2e: "loop-calls-tool", passed: true },
                { build: "agent-cli", stage: "s1-loop", e2e: "loop-stops", passed: true },
                { build: "agent-cli", stage: "s2-tools", e2e: "tool-schema", passed: false },
            ],
        })
        const timestamp = init.headers["x-starci-timestamp"] ?? ""
        expect(init.headers).toMatchObject({
            "x-starci-project": CI.STARCI_PROJECT_ID,
            "x-starci-oidc": "oidc.jwt.token",
            "x-starci-signature": `sha256=${createHmac("sha256", "project-secret-value").update(timestamp).update(".").update(init.body).digest("hex")}`,
        })
        expect(world.out.join("\n")).toContain("signed and attested by GitHub OIDC")
        expect(everythingSeen(world)).not.toContain("project-secret-value")
        expect(everythingSeen(world)).not.toContain("oidc.jwt.token")
        expect(init.body).not.toContain(SECRET_VALUE)
        expect(init.body).not.toContain("leaked")
    })

    it("reports one stage only, and says signed only when the workflow has no OIDC token", async () => {
        const { world, io, root, posts } = ciWorld({ ...CI, ACTIONS_ID_TOKEN_REQUEST_URL: undefined })

        expect(await ciReportBuild(io, { stage: "s1-loop" }, root)).toBe(0)

        const [{ init }] = posts as [(typeof posts)[number]]
        expect(init.headers["x-starci-oidc"]).toBeUndefined()
        expect(JSON.parse(init.body).harness).toHaveLength(2)
        expect(JSON.parse(init.body).passed).toBe(true)
        expect(world.out.join("\n")).toContain("signed only")
    })

    it("sends no OIDC header when GitHub does not answer, and fails when StarCi refuses the delivery", async () => {
        const noToken = ciWorld(CI, 200, 403)
        await ciReportBuild(noToken.io, {}, noToken.root)
        expect(noToken.posts[0]?.init.headers["x-starci-oidc"]).toBeUndefined()

        const refused = ciWorld(CI, 401)
        expect(await ciReportBuild(refused.io, {}, refused.root)).toBe(1)
        expect(refused.world.out.join("\n")).toContain("refused (HTTP 401)")
    })

    it("names the missing CI variables, never a value, and sends nothing; http to a remote host is refused", async () => {
        const missing = ciWorld({ ...CI, STARCI_CI_SECRET: undefined, GITHUB_SHA: "" })
        expect(await ciReportBuild(missing.io, {}, missing.root)).toBe(1)
        expect(missing.world.err.join("\n")).toContain("STARCI_CI_SECRET, GITHUB_SHA")
        expect(missing.posts).toHaveLength(0)

        const plain = ciWorld({ ...CI, STARCI_API_URL: "http://evil.test" })
        expect(await ciReportBuild(plain.io, {}, plain.root)).toBe(1)
        expect(plain.posts).toHaveLength(0)
    })

    it("needs the build marker and the report", async () => {
        const made = ciWorld()
        expect(await ciReportBuild(made.io, {}, made.world.cwd)).toBe(1)
        expect(made.world.err.join("\n")).toContain(HARNESS_STATE_FILE)
        expect(await ciReportBuild(made.io, { report: "nope.xml" }, made.root)).toBe(1)
        expect(await ciReportBuild(made.io, { stage: "7" }, made.root)).toBe(1)
        expect(made.posts).toHaveLength(0)
    })
})
