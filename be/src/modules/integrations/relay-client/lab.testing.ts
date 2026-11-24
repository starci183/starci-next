import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import type { CheckRun, CliIo } from "./relay-client.contracts"
import type { LabHost } from "./lab.contracts"
import { newLabState, type LabRunState } from "./lab.cli"
import { worldOf, lessonBody, type World } from "./lesson.testing"
import type { RelaySession } from "./task-run.cli"

/** Test support for the lab commands: a paired learner machine, real `git` and `tar` over real folders, a fake docker and test runner, and a file watcher the spec drives by hand. */
export const REPORT_LAB = `<testsuites>
  <testcase name="[test:orders-once] places an order once" time="0.25"/>
  <testcase name="stock never goes negative" time="0.5"><failure message="stock was -1">x</failure></testcase>
  <testcase name="skipped one"><skipped/></testcase>
</testsuites>`

/** The hidden test ids of the grade fixture, in the random order the relay sent them. */
export const SEED_ORDER = ["h-pay-once", "h-order-total", "h-stock"]

/** A grading report: two hidden scenarios green, one red, tagged `[scenario:<id>]` as the lab's grading command writes them. */
export const REPORT_GRADE = `<testsuites>
  <testcase name="[scenario:h-order-total] totals an order" time="0.1"/>
  <testcase name="[scenario:h-stock] stock never goes negative" time="0.2"><failure message="expected 0, got -1">x</failure></testcase>
  <testcase name="[scenario:h-pay-once] pays once" time="0.3"/>
</testsuites>`

/** The files of the lesson branch (`bugs/source/`) the fake StarCi serves, the project in `app/`. */
export const BUGS_FILES: Readonly<Record<string, string>> = {
    "app/src/orders.ts": "export const orders = 'buggy'\n",
    "app/src/stock.ts": "export const stock = 'buggy'\n",
    "app/docker-compose.yml": "services: {}\n",
    "app/package.json": "{}\n",
}

/** The files of the solution the fake StarCi serves once a submission passed. */
export const SOLUTION_FILES: Readonly<Record<string, string>> = {
    ...BUGS_FILES,
    "app/src/orders.ts": "export const orders = 'fixed'\n",
}

/** A tarball packed the way the relay packs it: `tar -czf` of the contents of a cut, relative names. */
const packed = (files: Readonly<Record<string, string>>): { readonly bytes: Buffer; readonly sha256: string } => {
    const folder = mkdtempSync(join(tmpdir(), "starci-lab-src-"))
    Object.entries(files).forEach(([path, text]) => {
        mkdirSync(dirname(join(folder, path)), { recursive: true })
        writeFileSync(join(folder, path), text)
    })
    execSync("tar -czf ../pack.tgz .", { cwd: folder })
    const bytes = readFileSync(join(folder, "..", "pack.tgz"))
    return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") }
}

let bugsPack: ReturnType<typeof packed> | undefined
let solutionPack: ReturnType<typeof packed> | undefined

/** The lesson branch tarball, packed once. */
export const bugsTarball = (): ReturnType<typeof packed> => (bugsPack ??= packed(BUGS_FILES))

/** The solution tarball, packed once. */
export const solutionTarball = (): ReturnType<typeof packed> => (solutionPack ??= packed(SOLUTION_FILES))

export const SOURCE_COMMIT = "c".repeat(40)

/** The `lab` section of a manifest body, as the relay signs it. */
export const labBody = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    courseId: "backend",
    lessonId: "orders",
    source: {
        url: "/api/relay/courses/backend/orders/bugs.tgz",
        sha256: bugsTarball().sha256,
        commit: SOURCE_COMMIT,
    },
    dir: "app",
    compose: "docker-compose.yml",
    project: "backend-orders",
    services: ["api", "db"],
    test: {
        command: "npm test",
        scenario: "npm test -- --scenario {id}",
        report: "reports/junit.xml",
        timeoutMs: 120_000,
    },
    files: ["src/orders.ts", "src/stock.ts"],
    chaos: [
        { id: "slow-db", on: "node chaos.js slow-db on", off: "node chaos.js slow-db off" },
        { id: "drop-queue", on: "node chaos.js drop-queue on", off: "node chaos.js drop-queue off" },
    ],
    chaosOn: [],
    action: "boot",
    ...extra,
})

/** The solution link of a manifest that has unlocked it. */
export const solutionLink = (): Record<string, unknown> => ({
    url: "/api/relay/courses/backend/orders/solution.tgz",
    sha256: solutionTarball().sha256,
    commit: SOURCE_COMMIT,
})

/** A grade section with one hidden file under `grader/`, its hash right. */
export const gradeBody = (content = "it('hidden', () => {})", sha256?: string): Record<string, unknown> => ({
    submissionId: "sub-1",
    nonce: "nonce-1",
    command: "npm run grade",
    seedOrder: SEED_ORDER,
    commit: null,
    files: [
        {
            path: "grader/orders.hidden.test.ts",
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

/**
 * What the fake answers for a command: the exit code and output, and the JUnit report a test command leaves in its folder. A `git` or `tar`
 * command runs for real unless the answer names an exit code for it.
 */
export type Answer = { readonly exitCode?: number; readonly output?: string; readonly report?: string } | undefined

export interface LabWorld {
    readonly world: World
    readonly io: CliIo
    readonly host: LabHost & { readonly trigger: (path: string) => void; readonly closed: () => boolean }
    readonly home: string
    /** The lab folder, `~/starci/backend/orders`. */
    readonly root: string
    /** The project folder inside it, `app`. */
    readonly work: string
    readonly ran: Array<Ran>
    readonly session: RelaySession
    readonly state: LabRunState
    /** Every download the CLI made: the URL and whether the device token went with it. */
    readonly downloads: Array<{ url: string; bearer: string | undefined }>
    /** Every upload the CLI sent, as `[mutation, input]`. */
    readonly uploads: () => Array<{ mutation: string; input: Record<string, unknown> }>
    /** Runs a real git command in the lab folder, as the learner would, and answers its output. */
    readonly git: (command: string) => string
}

const REAL = /^(git|tar)\b/u
const IDENTITY = "-c user.name=learner -c user.email=learner@example.invalid"

/** Runs a command for real in a folder and answers how it ended. */
const really = (command: string, cwd: string): CheckRun => {
    try {
        const output = execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
        return { exitCode: 0, output, durationMs: 1 }
    } catch (error) {
        const failed = error as { status?: number; stdout?: string; stderr?: string }
        return { exitCode: failed.status ?? 1, output: `${failed.stdout ?? ""}${failed.stderr ?? ""}`, durationMs: 1 }
    }
}

/**
 * A learner machine whose runner starts no docker or test process: `answer` decides each command's result, and the report a test command
 * leaves is written where the real one would. The download serves the real tarballs of the lab, and `git` and `tar` run for real over real
 * folders, so the baseline commit, the clean worktree and the dirty-tree check are the ones git makes.
 */
export const labWorld = (
    answer: (command: string, cwd: string) => Answer = () => undefined,
    memory = 8 * 1024 ** 3,
    served: (url: string) => { readonly status: number; readonly bytes: Buffer } = (url) => ({
        status: 200,
        bytes: url.endsWith("solution.tgz") ? solutionTarball().bytes : bugsTarball().bytes,
    }),
): LabWorld => {
    const base = worldOf(lessonBody())
    const home = mkdtempSync(join(tmpdir(), "starci-lab-home-"))
    const root = join(home, "starci", "backend", "orders")
    const work = join(root, "app")
    const ran: Array<Ran> = []
    const downloads: LabWorld["downloads"] = []
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
        const made = answer(command, cwd)
        if (REAL.test(command) && made?.exitCode === undefined) return Promise.resolve(really(command, cwd))
        if (made?.report !== undefined) {
            mkdirSync(join(cwd, "reports"), { recursive: true })
            writeFileSync(join(cwd, "reports", "junit.xml"), made.report)
        }
        return Promise.resolve({ exitCode: made?.exitCode ?? 0, output: made?.output ?? "ran", durationMs: 7 })
    }
    const download: CliIo["download"] = (url, bearer) => {
        downloads.push({ url, bearer })
        return Promise.resolve(served(url))
    }
    const io: CliIo = { ...base.io, labHost: host, runCommand, download }
    return {
        world: base,
        io,
        host,
        home,
        root,
        work,
        ran,
        downloads,
        state: newLabState(),
        session: { baseUrl: "https://app.test", token: "t".repeat(43) },
        uploads: () =>
            base.sent
                .filter((body) => !body.query.includes("relayManifest"))
                .map((body) => ({
                    mutation: /\{\s*(\w+)\(/u.exec(body.query)?.[1] ?? "",
                    input: body.variables.input as Record<string, unknown>,
                })),
        git: (command) =>
            execSync(`git ${command.startsWith("commit") ? IDENTITY : ""} ${command}`, {
                cwd: root,
                encoding: "utf8",
                stdio: ["ignore", "pipe", "pipe"],
            }),
    }
}

/** True when a path exists. */
export const exists = (path: string): boolean => existsSync(path)

/** The text of a file. */
export const textOf = (path: string): string => readFileSync(path, "utf8")
