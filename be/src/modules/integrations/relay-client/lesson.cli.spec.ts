import { generateKeyPairSync, sign } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { writeConfig } from "./device-settings.adapter"
import { composeLesson, promptLesson, pullLesson, runLesson } from "./lesson.cli"
import { ManifestPolicy } from "./manifest.policy"
import type { CheckRun, CliIo, FetchInit } from "./relay-client.contracts"

const KEYS = generateKeyPairSync("ed25519")
const PUBLIC_PEM = KEYS.publicKey.export({ type: "spki", format: "pem" }).toString()
const COMMIT = "b".repeat(40)

const REPORT_RED = `<testsuites>
  <testcase name="[scenario:dup-submit] [idempotency] second call" time="0.2">
    <failure message="[invariant:idempotency-key] charged twice">x</failure>
  </testcase>
</testsuites>`
const REPORT_GREEN = `<testsuites><testcase name="[scenario:dup-submit] [idempotency] second call" time="0.2"/></testsuites>`

const scenario = (extra: Record<string, unknown> = {}) => ({
    id: "dup-submit",
    title: "Duplicate submit",
    brief: "Send the same command twice.",
    concepts: ["idempotency"],
    command: "npm test -- --scenario dup-submit",
    cwd: ".",
    report: "reports/junit.xml",
    timeoutMs: 1000,
    guards: [{ name: "idempotency-key", env: "GUARD_IDEMPOTENCY_KEY", off: "off" }],
    ...extra,
})

const lessonBody = (extra: Record<string, unknown> = {}) => ({
    lessonId: "outbox",
    repo: { url: "https://x.test/lesson-outbox.git", commit: COMMIT },
    dir: ".",
    compose: ".docker",
    project: "outbox",
    invariants: { "idempotency-key": "One command, one effect" },
    scenarios: [scenario()],
    ...extra,
})

interface World {
    readonly io: CliIo
    readonly cwd: string
    readonly out: Array<string>
    readonly err: Array<string>
    readonly commands: Array<{ command: string; env: Readonly<Record<string, string>> | undefined; cwd: string }>
    readonly sent: Array<{ query: string; variables: Record<string, unknown> }>
}

/** A learner machine with a paired device, a fake StarCi that signs `lesson`, and a command runner that writes `report`. */
const worldOf = (
    lesson: unknown,
    onRun: (cwd: string) => { report?: string; exitCode?: number } = () => ({}),
): World => {
    const home = mkdtempSync(join(tmpdir(), "starci-next-home-"))
    const cwd = mkdtempSync(join(tmpdir(), "starci-next-work-"))
    const env = { STARCI_NEXT_HOME: home, STARCI_NEXT_URL: "https://app.test", STARCI_NEXT_MANIFEST_KEY: PUBLIC_PEM }
    writeConfig(env, { baseUrl: "https://app.test", deviceToken: "t".repeat(43) })
    const out: Array<string> = []
    const err: Array<string> = []
    const commands: World["commands"] = []
    const sent: World["sent"] = []
    let n = 0
    const manifests = new ManifestPolicy()
    const io: CliIo = {
        env,
        out: (line) => out.push(line),
        err: (line) => err.push(line),
        fetch: (_url: string, init: FetchInit) => {
            const body = JSON.parse(init.body) as { query: string; variables: Record<string, unknown> }
            sent.push(body)
            if (body.query.includes("relayManifest")) {
                const payload = JSON.stringify({
                    manifestId: "m-1",
                    taskId: (body.variables.input as { taskId: string }).taskId,
                    checks: [],
                    lesson,
                })
                const signature = sign(null, Buffer.from(payload, "utf8"), KEYS.privateKey).toString("base64")
                return Promise.resolve({
                    status: 200,
                    text: JSON.stringify({ data: { relayManifest: { manifestId: "m-1", payload, signature } } }),
                })
            }
            return Promise.resolve({
                status: 200,
                text: JSON.stringify({ data: { ok: { eventId: "e", accepted: true } } }),
            })
        },
        sleep: () => Promise.resolve(),
        now: () => 0,
        ids: () => `00000000-0000-4000-8000-${String((n += 1)).padStart(12, "0")}`,
        hostName: () => "laptop",
        platform: () => "linux",
        confirm: () => Promise.resolve(true),
        exit: () => undefined,
        verify: (payload, signature, key) => manifests.verified(payload, signature, key),
        runCommand: (command, where, _timeout, runEnv): Promise<CheckRun> => {
            commands.push({ command, env: runEnv, cwd: where })
            const made = onRun(where)
            if (made.report !== undefined) {
                mkdirSync(join(where, "reports"), { recursive: true })
                writeFileSync(join(where, "reports", "junit.xml"), made.report)
            }
            return Promise.resolve({ exitCode: made.exitCode ?? 0, output: "ran", durationMs: 5 })
        },
    }
    return { io, cwd, out, err, commands, sent }
}

/** Pulls the lesson by hand: the repo folder with its marker, as `pull` leaves it. */
const pulled = (world: World): string => {
    const root = join(world.cwd, "outbox")
    mkdirSync(join(root, ".git"), { recursive: true })
    writeFileSync(
        join(root, ".starci-lesson.json"),
        JSON.stringify({ lessonId: "outbox", commit: COMMIT, dir: ".", compose: ".docker", project: "outbox" }),
    )
    return root
}

const uploads = (world: World): Array<{ query: string; input: Record<string, unknown> }> =>
    world.sent
        .filter((body) => !body.query.includes("relayManifest"))
        .map((body) => ({ query: body.query, input: body.variables.input as Record<string, unknown> }))

describe("pullLesson", () => {
    it("refuses any language but typescript before asking StarCi", async () => {
        const world = worldOf(lessonBody())

        expect(await pullLesson(world.io, "outbox", "java", world.cwd)).toBe(1)
        expect(world.err[0]).toContain("typescript only")
        expect(world.sent).toHaveLength(0)
    })

    it("clones at the signed commit and writes the marker", async () => {
        const world = worldOf(lessonBody(), (where) => {
            if (!existsSync(join(where, "outbox"))) mkdirSync(join(where, "outbox", ".git"), { recursive: true })
            return {}
        })

        expect(await pullLesson(world.io, "outbox", "typescript", world.cwd)).toBe(0)

        expect(world.commands.map((run) => run.command)).toEqual([
            "git clone https://x.test/lesson-outbox.git outbox",
            "git fetch --all --quiet",
            `git checkout --detach ${COMMIT}`,
        ])
        expect(JSON.parse(readFileSync(join(world.cwd, "outbox", ".starci-lesson.json"), "utf8"))).toMatchObject({
            commit: COMMIT,
        })
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
