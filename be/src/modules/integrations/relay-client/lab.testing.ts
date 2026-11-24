import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import type { CheckRun, CliIo } from "./relay-client.contracts"
import type { LabHost } from "./lab.contracts"
import { newLabState, type LabRunState } from "./lab.cli"
import { worldOf, lessonBody, type World } from "./lesson.testing"
import type { RelaySession } from "./task-run.cli"

/** Test support for the lab commands: a paired learner machine, a fake docker/git runner and a file watcher the spec drives by hand. */
export const COMMIT_A = "a".repeat(40)
export const COMMIT_B = "c".repeat(40)

export const REPORT_LAB = `<testsuites>
  <testcase name="[test:orders-once] places an order once" time="0.25"/>
  <testcase name="stock never goes negative" time="0.5"><failure message="stock was -1">x</failure></testcase>
  <testcase name="skipped one"><skipped/></testcase>
</testsuites>`

/** The `lab` section of a manifest body. */
export const labBody = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    courseId: "backend",
    lessonId: "orders",
    repo: { url: "https://github.com/learner/backend.git", branch: "main", commit: null },
    compose: "docker/compose.yml",
    project: "backend-orders",
    services: ["api", "db"],
    seed: { command: "npm run seed", timeoutMs: 60_000 },
    test: { command: "npm test", report: "reports/junit.xml", timeoutMs: 120_000 },
    files: ["src/orders.ts", "src/stock.ts"],
    chaos: [
        { id: "slow-db", env: "CHAOS_DB_DELAY_MS", value: "800" },
        { id: "drop-queue", env: "CHAOS_DROP_QUEUE", value: "1" },
    ],
    chaosOn: [],
    action: "boot",
    ...extra,
})

/** A grade section with one hidden file, its hash right. */
export const gradeBody = (content = "it('hidden', () => {})", sha256?: string): Record<string, unknown> => ({
    submissionId: "sub-1",
    nonce: "nonce-1",
    seedOrder: ["base", "orders"],
    commit: COMMIT_B,
    files: [
        {
            path: "hidden/orders.hidden.test.ts",
            sha256: sha256 ?? createHash("sha256").update(content).digest("hex"),
            content: Buffer.from(content).toString("base64"),
        },
    ],
})

/** One command the runner was asked to run. */
export interface Ran {
    readonly command: string
    readonly cwd: string
    readonly env: Readonly<Record<string, string>> | undefined
}

/** What the fake runner answers for a command. */
export type Answer = { readonly exitCode?: number; readonly output?: string; readonly report?: string } | undefined

export interface LabWorld {
    readonly world: World
    readonly io: CliIo
    readonly host: LabHost & { readonly trigger: (path: string) => void; readonly closed: () => boolean }
    readonly home: string
    readonly root: string
    readonly ran: Array<Ran>
    readonly session: RelaySession
    readonly state: LabRunState
    /** Every upload the CLI sent, as `[mutation, input]`. */
    readonly uploads: () => Array<{ mutation: string; input: Record<string, unknown> }>
}

/** A learner machine whose runner never starts a process: `answer` decides each command's result; the clone, worktree and report are made on disk like the real commands would. */
export const labWorld = (
    answer: (command: string, cwd: string) => Answer = () => undefined,
    memory = 8 * 1024 ** 3,
): LabWorld => {
    const base = worldOf(lessonBody())
    const home = mkdtempSync(join(tmpdir(), "starci-lab-home-"))
    const root = join(home, "starci", "backend")
    const ran: Array<Ran> = []
    let onChange: (path: string) => void = () => undefined
    let isClosed = false
    const host: LabWorld["host"] = {
        home: () => home,
        freeMemBytes: () => memory,
        nodeVersion: () => "v22.3.0",
        watch: (_root, _paths, change) => {
            onChange = change
            isClosed = false
            return {
                close: () => {
                    isClosed = true
                },
            }
        },
        trigger: (path) => onChange(path),
        closed: () => isClosed,
    }
    const runCommand: CliIo["runCommand"] = (command, cwd, _timeout, env): Promise<CheckRun> => {
        ran.push({ command, cwd, env })
        const made = answer(command, cwd) ?? {}
        if (command.startsWith("git clone")) {
            mkdirSync(join(root, ".git"), { recursive: true })
            mkdirSync(join(root, "src"), { recursive: true })
            writeFileSync(join(root, "src", "orders.ts"), "export const orders = 1\n")
            writeFileSync(join(root, "src", "stock.ts"), "export const stock = 1\n")
        }
        const worktree = /worktree add --detach "([^"]+)"/u.exec(command)?.[1]
        if (worktree !== undefined && (made.exitCode ?? 0) === 0) mkdirSync(worktree, { recursive: true })
        if (made.report !== undefined) {
            mkdirSync(dirname(join(cwd, "reports", "junit.xml")), { recursive: true })
            writeFileSync(join(cwd, "reports", "junit.xml"), made.report)
        }
        const output = command.startsWith("git remote get-url")
            ? "https://github.com/learner/backend.git\n"
            : command === "git rev-parse HEAD"
              ? `${COMMIT_A}\n`
              : (made.output ?? "ran")
        return Promise.resolve({ exitCode: made.exitCode ?? 0, output, durationMs: 7 })
    }
    const io: CliIo = { ...base.io, labHost: host, runCommand }
    return {
        world: base,
        io,
        host,
        home,
        root,
        ran,
        state: newLabState(),
        session: { baseUrl: "https://app.test", token: "t".repeat(43) },
        uploads: () =>
            base.sent
                .filter((body) => !body.query.includes("relayManifest"))
                .map((body) => ({
                    mutation: /\{\s*(\w+)\(/u.exec(body.query)?.[1] ?? "",
                    input: body.variables.input as Record<string, unknown>,
                })),
    }
}

/** True when a path exists. */
export const exists = (path: string): boolean => existsSync(path)
