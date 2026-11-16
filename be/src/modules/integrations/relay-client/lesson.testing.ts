import { generateKeyPairSync, sign } from "node:crypto"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { writeConfig } from "./device-settings.adapter"
import { ManifestPolicy } from "./manifest.policy"
import type { CheckRun, CliIo, FetchInit } from "./relay-client.contracts"

/** Test support for the lesson commands: a paired learner machine, a fake StarCi that signs a lesson, and a pulled lesson folder. */
export const KEYS = generateKeyPairSync("ed25519")
export const PUBLIC_PEM = KEYS.publicKey.export({ type: "spki", format: "pem" }).toString()
export const COMMIT = "b".repeat(40)

export const REPORT_RED = `<testsuites>
  <testcase name="[scenario:dup-submit] [idempotency] second call" time="0.2">
    <failure message="[invariant:idempotency-key] charged twice">x</failure>
  </testcase>
</testsuites>`
export const REPORT_GREEN = `<testsuites><testcase name="[scenario:dup-submit] [idempotency] second call" time="0.2"/></testsuites>`

export const scenario = (extra: Record<string, unknown> = {}) => ({
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

export const lessonBody = (extra: Record<string, unknown> = {}) => ({
    lessonId: "outbox",
    source: { url: "https://files.test/outbox.tgz", sha256: "d".repeat(64), commit: COMMIT },
    dir: ".",
    compose: ".docker",
    project: "outbox",
    invariants: { "idempotency-key": "One command, one effect" },
    scenarios: [scenario()],
    ...extra,
})

export interface World {
    readonly io: CliIo
    readonly cwd: string
    readonly out: Array<string>
    readonly err: Array<string>
    readonly commands: Array<{ command: string; env: Readonly<Record<string, string>> | undefined; cwd: string }>
    readonly sent: Array<{ query: string; variables: Record<string, unknown> }>
}

/** A learner machine with a paired device, a fake StarCi that signs `lesson`, and a command runner that writes `report`. */
export const worldOf = (
    lesson: unknown,
    onRun: (cwd: string) => { report?: string; exitCode?: number } = () => ({}),
    sectionKey: "lesson" | "harness" = "lesson",
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
                    [sectionKey]: lesson,
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
        download: () => Promise.resolve({ status: 0, bytes: Buffer.alloc(0) }),
        isTty: () => true,
        listen: () => ({ ended: new Promise<string>(() => undefined), close: () => undefined }),
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
export const pulled = (world: World): string => {
    const root = join(world.cwd, "outbox")
    mkdirSync(join(root, ".git"), { recursive: true })
    writeFileSync(
        join(root, ".starci-lesson.json"),
        JSON.stringify({
            lessonId: "outbox",
            commit: COMMIT,
            sha256: "d".repeat(64),
            dir: ".",
            compose: ".docker",
            project: "outbox",
        }),
    )
    return root
}

export const uploads = (world: World): Array<{ query: string; input: Record<string, unknown> }> =>
    world.sent
        .filter((body) => !body.query.includes("relayManifest"))
        .map((body) => ({ query: body.query, input: body.variables.input as Record<string, unknown> }))
