import { createHash } from "node:crypto"
import { basename, dirname, join } from "node:path"
import type { CliIo, PendingUpload } from "./relay-client.contracts"
import type { LabFileSnapshot, LabHost, LabSection, LabStage, LabTest } from "./lab.contracts"
import {
    hasPath,
    hasRepository,
    makeFolder,
    makeGradeFolder,
    readDeviceKey,
    readTreeFile,
    readTreeText,
    removeTree,
    removeTreeFile,
    writeHiddenFiles,
} from "./lab-files.adapter"
import { labTestsOf, snapshotOf } from "./lab-report.policy"
import { gradeTextOf, signText } from "./lab-sign.policy"
import { chaosEnvOf, labTaskIdOf } from "./lab.policy"
import { LOG_TAIL_MAX, flush, type RelaySession } from "./task-run.cli"
import { readQueue, writeQueue } from "./upload-queue.adapter"

/** How long the files may be quiet before a change is uploaded. */
export const WATCH_DEBOUNCE_MS = 400
/** The oldest Node a lab runs on. */
const MIN_NODE_MAJOR = 22
/** The least free memory a lab boots with. */
const MIN_FREE_MEM_BYTES = 1024 ** 3
/** How long a git or docker step may take. */
const STEP_TIMEOUT_MS = 900_000
/** How long a quick probe (docker info, git rev-parse) may take. */
const PROBE_TIMEOUT_MS = 60_000
/** The longest detail a boot stage carries. */
const DETAIL_MAX = 300
/** The lines of a service's log the CLI asks docker for. */
const LOG_LINES = 400

/** What the lab commands remember between runs inside one `listen`: the file watcher, and the uploads one after another. */
export interface LabRunState {
    /** The watcher of the last boot, until a new boot or the end of `listen`. */
    watcher: { readonly close: () => void } | undefined
    /** The uploads in order: a watcher's upload never overtakes a stage's. */
    sending: Promise<void>
}

/** A fresh state: no watcher, nothing sending. */
export const newLabState = (): LabRunState => ({ watcher: undefined, sending: Promise.resolve() })

/** Stops watching the files. */
export const stopLabWatch = (state: LabRunState): void => {
    state.watcher?.close()
    state.watcher = undefined
}

/** Everything one lab run needs. */
interface LabCtx {
    readonly io: CliIo
    readonly session: RelaySession
    readonly state: LabRunState
    readonly lab: LabSection
    readonly host: LabHost
    readonly taskId: string
    readonly runId: string
    /** The learner's clone: `<home>/starci/<course>`. */
    readonly root: string
    /** The environment of the chaos ids switched on. */
    readonly env: Readonly<Record<string, string>>
}

/** What one stage came to. */
interface StageResult {
    readonly ok: boolean
    readonly detail: string
}

const composeBase = (lab: LabSection): string => `docker compose -p ${lab.project} -f ${lab.compose}`

/** A folder as one shell word, or null when it holds a character a shell would read (no manifest value ever reaches it). */
const shellPath = (path: string): string | null => (/["$`%^!\r\n]/u.test(path) ? null : `"${path}"`)

/** The lines that show what a lab manifest will run here: its commands come from the verified manifest alone. */
export const labLinesOf = (lab: LabSection): ReadonlyArray<string> => {
    const head = `Lab ${labTaskIdOf(lab)}: ${lab.action}.`
    const chaos = lab.chaosOn.length === 0 ? "none" : lab.chaosOn.join(", ")
    const tests = `  tests: ${lab.test.command}   (report ${lab.test.report}, at most ${lab.test.timeoutMs / 1000}s)`
    if (lab.action === "grade")
        return [
            head,
            `  grade: ${lab.grade?.files.length ?? 0} hidden file(s) in a clean checkout of ${(lab.grade?.commit ?? "").slice(0, 10)}, deleted afterwards`,
            tests,
            `  chaos on: ${chaos}`,
        ]
    if (lab.action === "boot")
        return [
            head,
            `  clone: ${lab.repo.url} (branch ${lab.repo.branch}${lab.repo.commit === null ? "" : `, commit ${lab.repo.commit.slice(0, 10)}`}) into ~/starci/${lab.courseId}`,
            `  compose: ${composeBase(lab)} up -d --build`,
            `  seed: ${lab.seed.command}   (at most ${lab.seed.timeoutMs / 1000}s)`,
            tests,
            `  chaos on: ${chaos}`,
            `  watching: ${lab.files.join(", ") || "no files"}`,
        ]
    return [
        head,
        ...(lab.action === "chaos" ? [`  compose: ${composeBase(lab)} up -d`] : []),
        tests,
        `  chaos on: ${chaos}`,
    ]
}

/** The question `listen` asks before it runs a lab manifest. */
export const labAskLine = (lab: LabSection): string =>
    `StarCi wants to ${lab.action} the lab ${labTaskIdOf(lab)} on this machine. Run it?`

/** Sends the uploads after the ones before them: the waiting ones go first, what StarCi does not accept stays queued for the next run. */
const send = (c: LabCtx, uploads: ReadonlyArray<PendingUpload>): Promise<void> => {
    c.state.sending = c.state.sending
        .then(async () => {
            writeQueue(c.io.env, await flush(c.io, c.session, [...readQueue(c.io.env), ...uploads]))
        })
        .catch(() => c.io.err("An upload could not be saved to the queue."))
    return c.state.sending
}

/** One boot report: a stage and how it stands. */
const bootUpload = (
    c: LabCtx,
    stage: LabStage,
    status: "running" | "done" | "failed",
    detail: string,
    durationMs: number,
): PendingUpload => ({
    mutation: "relayLabBoot",
    input: {
        eventId: c.io.ids(),
        taskId: c.taskId,
        runId: c.runId,
        stage,
        status,
        detail: detail.slice(0, DETAIL_MAX),
        durationMs,
    },
})

/** Reports a stage as running, runs it, then reports it done or failed with its duration. Answers whether it passed. */
const stage = async (c: LabCtx, name: LabStage, work: () => Promise<StageResult>): Promise<boolean> => {
    c.io.out(`[${name}] running...`)
    await send(c, [bootUpload(c, name, "running", "", 0)])
    const started = c.io.now()
    const result = await work().catch((error: unknown): StageResult => {
        c.io.err(`[${name}] ${error instanceof Error ? error.message : "unexpected error"}.`)
        return { ok: false, detail: "unexpected error" }
    })
    const durationMs = Math.max(0, c.io.now() - started)
    c.io.out(`[${name}] ${result.ok ? "done" : "FAILED"} (${durationMs} ms)${result.detail === "" ? "" : `: ${result.detail}`}`)
    await send(c, [bootUpload(c, name, result.ok ? "done" : "failed", result.detail, durationMs)])
    return result.ok
}

/** Whether docker answers, Node is new enough and memory is free. */
const machineStage = async (c: LabCtx): Promise<StageResult> => {
    const docker = await c.io.runCommand("docker info", c.host.home(), PROBE_TIMEOUT_MS, undefined, true)
    const version = c.host.nodeVersion()
    const major = Number(/^v?(\d+)/u.exec(version)?.[1] ?? "0")
    const free = c.host.freeMemBytes()
    const problems = [
        docker.exitCode === 0 ? null : "Docker is not running",
        major >= MIN_NODE_MAJOR ? null : `Node ${MIN_NODE_MAJOR} or newer is needed (this is ${version})`,
        free >= MIN_FREE_MEM_BYTES ? null : "less than 1 GiB of memory is free",
    ].filter((problem) => problem !== null)
    if (problems.length > 0) return { ok: false, detail: `${problems.join("; ")}.` }
    return { ok: true, detail: `docker running, node ${version}, ${(free / 1024 ** 3).toFixed(1)} GiB free` }
}

/** Clones the repository into `~/starci/<course>`, or fetches into the clone that is there; a set commit is checked out. */
const cloneStage = async (c: LabCtx): Promise<StageResult> => {
    const { url, branch, commit } = c.lab.repo
    const quoted = shellPath(c.root)
    if (quoted === null) return { ok: false, detail: "The folder name has a character a shell would read." }
    if (hasRepository(c.root)) {
        const remote = await c.io.runCommand("git remote get-url origin", c.root, PROBE_TIMEOUT_MS, undefined, true)
        if (remote.exitCode !== 0 || remote.output.trim() !== url)
            return { ok: false, detail: `${c.root} holds another repository; move it away.` }
        const fetched = await c.io.runCommand(`git fetch origin ${branch}`, c.root, STEP_TIMEOUT_MS)
        if (fetched.exitCode !== 0) return { ok: false, detail: `git fetch failed (exit ${fetched.exitCode}).` }
    } else {
        if (hasPath(c.root)) return { ok: false, detail: `${c.root} exists and is not a repository.` }
        makeFolder(dirname(c.root))
        const cloned = await c.io.runCommand(
            `git clone --branch ${branch} --single-branch ${url} ${quoted}`,
            dirname(c.root),
            STEP_TIMEOUT_MS,
        )
        if (cloned.exitCode !== 0) return { ok: false, detail: `git clone failed (exit ${cloned.exitCode}).` }
    }
    if (commit !== null) {
        const checkout = await c.io.runCommand(`git checkout --detach ${commit}`, c.root, STEP_TIMEOUT_MS)
        if (checkout.exitCode !== 0) return { ok: false, detail: `git checkout failed (exit ${checkout.exitCode}).` }
    }
    return { ok: true, detail: `${basename(c.root)} at ${commit === null ? branch : commit.slice(0, 10)}` }
}

/** `docker compose up -d` with the chaos environment; `--build` on a boot. */
const composeUp = async (c: LabCtx, build: boolean): Promise<StageResult> => {
    const run = await c.io.runCommand(
        `${composeBase(c.lab)} up -d${build ? " --build" : ""}`,
        c.root,
        STEP_TIMEOUT_MS,
        c.env,
    )
    return run.exitCode === 0
        ? { ok: true, detail: "stack is up" }
        : { ok: false, detail: `docker compose up failed (exit ${run.exitCode}).` }
}

/** The seed command of the manifest. */
const seedStage = async (c: LabCtx): Promise<StageResult> => {
    const run = await c.io.runCommand(c.lab.seed.command, c.root, c.lab.seed.timeoutMs, c.env)
    return run.exitCode === 0
        ? { ok: true, detail: "seeded" }
        : { ok: false, detail: `seed failed (exit ${run.exitCode}).` }
}

/** What the test command left: how it ended and the tests of its report, null when no report could be read. */
interface TestRead {
    readonly exitCode: number
    readonly tests: ReadonlyArray<LabTest> | null
}

/** Runs the test command in a folder with an environment and reads its JUnit report; the report of an earlier run is removed first. */
const readTests = async (
    c: LabCtx,
    cwd: string,
    env: Readonly<Record<string, string>>,
): Promise<TestRead> => {
    removeTreeFile(cwd, c.lab.test.report)
    c.io.out(`Running tests: ${c.lab.test.command}`)
    const run = await c.io.runCommand(c.lab.test.command, cwd, c.lab.test.timeoutMs, env)
    const report = readTreeText(cwd, c.lab.test.report)
    if (report === null) c.io.err(`No JUnit report at ${c.lab.test.report}: the test command must write it.`)
    const tests = report === null ? null : labTestsOf(report)
    if (tests !== null)
        c.io.out(`  ${tests.filter((test) => test.passed).length}/${tests.length} test(s) passed (exit ${run.exitCode}, ${run.durationMs} ms)`)
    return { exitCode: run.exitCode, tests }
}

/** The commit the clone stands on, or the manifest's own when git does not say. */
const headCommit = async (c: LabCtx): Promise<string> => {
    const run = await c.io.runCommand("git rev-parse HEAD", c.root, PROBE_TIMEOUT_MS, undefined, true)
    const head = run.output.trim()
    return run.exitCode === 0 && /^[0-9a-f]{40}$/u.test(head) ? head : (c.lab.repo.commit ?? "")
}

const uploadTests = (c: LabCtx, commit: string, tests: ReadonlyArray<LabTest>): PendingUpload => ({
    mutation: "relayLabTests",
    input: {
        eventId: c.io.ids(),
        taskId: c.taskId,
        runId: c.runId,
        commit,
        chaosOn: [...c.lab.chaosOn],
        tests: [...tests],
    },
})

/** Uploads the snapshot of the given lab files (only paths of the lab's own list), as the working tree holds them. */
const uploadFiles = async (c: LabCtx, paths: ReadonlyArray<string>): Promise<void> => {
    const files: ReadonlyArray<LabFileSnapshot> = snapshotOf(paths, c.lab.files, (path) => readTreeFile(c.root, path))
    if (files.length === 0) return
    await send(c, [
        {
            mutation: "relayLabFiles",
            input: {
                eventId: c.io.ids(),
                taskId: c.taskId,
                commit: await headCommit(c),
                files: files.map((file) => ({ ...file })),
            },
        },
    ])
}

/** Uploads the tail of each service's log as a `log` upload filed under the service's name. */
const uploadLogs = async (c: LabCtx): Promise<void> => {
    const uploads = await c.lab.services.reduce<Promise<ReadonlyArray<PendingUpload>>>(async (before, service) => {
        const done = await before
        const run = await c.io.runCommand(
            `${composeBase(c.lab)} logs --no-color --tail ${LOG_LINES} ${service}`,
            c.root,
            PROBE_TIMEOUT_MS,
            undefined,
            true,
        )
        if (run.exitCode !== 0) {
            c.io.err(`No log of ${service} (exit ${run.exitCode}).`)
            return done
        }
        const log: PendingUpload = {
            mutation: "relayLog",
            input: {
                eventId: c.io.ids(),
                taskId: c.taskId,
                runId: c.runId,
                checkId: service,
                text: run.output.slice(-LOG_TAIL_MAX),
            },
        }
        return [...done, log]
    }, Promise.resolve([]))
    if (uploads.length > 0) await send(c, uploads)
}

/** Runs the tests of the clone and sends lab.tests, the files when asked, then the logs; answers the tests, null when none could be read. */
const testAndUpload = async (c: LabCtx, withFiles: boolean): Promise<ReadonlyArray<LabTest> | null> => {
    const read = await readTests(c, c.root, c.env)
    if (read.tests !== null) await send(c, [uploadTests(c, await headCommit(c), read.tests)])
    if (withFiles) await uploadFiles(c, c.lab.files)
    await uploadLogs(c)
    return read.tests
}

/** Watches the lab's files; after 400 ms of quiet the changed ones are uploaded. */
const startWatch = (c: LabCtx): void => {
    stopLabWatch(c.state)
    if (c.lab.files.length === 0) return
    const dirty = new Set<string>()
    let generation = 0
    c.state.watcher = c.host.watch(c.root, c.lab.files, (path) => {
        dirty.add(path)
        generation += 1
        const mine = generation
        void c.io
            .sleep(WATCH_DEBOUNCE_MS)
            .then(() => {
                if (mine !== generation) return undefined
                const changed = [...dirty]
                dirty.clear()
                return uploadFiles(c, changed)
            })
            .catch(() => c.io.err("A changed file could not be uploaded."))
    })
    c.io.out(`Watching ${c.lab.files.length} file(s) for changes.`)
}

/** The boot: machine, clone, compose, seed, first run; each stage reports running then done or failed, and the first failure ends it. */
const boot = async (c: LabCtx): Promise<number> => {
    stopLabWatch(c.state)
    const stages: ReadonlyArray<readonly [LabStage, () => Promise<StageResult>]> = [
        ["machine", () => machineStage(c)],
        ["clone", () => cloneStage(c)],
        ["compose", () => composeUp(c, true)],
        ["seed", () => seedStage(c)],
        [
            "first-run",
            async () => {
                const tests = await testAndUpload(c, true)
                return tests === null || tests.length === 0
                    ? { ok: false, detail: "The test command wrote no readable report." }
                    : { ok: true, detail: `${tests.filter((test) => test.passed).length}/${tests.length} tests pass` }
            },
        ],
    ]
    const passed = await stages.reduce<Promise<boolean>>(
        async (before, [name, work]) => (await before) && (await stage(c, name, work)),
        Promise.resolve(true),
    )
    if (!passed) return 1
    startWatch(c)
    return 0
}

/** Runs `fn`, and says on stderr when it throws instead of stopping the cleanup behind it. */
const attempt = async (c: LabCtx, what: string, fn: () => unknown): Promise<void> => {
    try {
        await fn()
    } catch {
        c.io.err(`Cleanup: could not ${what}.`)
    }
}

/**
 * The grade: a clean checkout of the graded commit in a temporary folder (a detached worktree of the clone, never the working
 * tree), the hidden files verified against their hashes and written in, the tests run there against the composed stack with the
 * seed order in STARCI_SEED_ORDER, then the hidden files and the worktree are deleted whatever happened, and the result is
 * signed with the device key and uploaded. The hidden files' content is uploaded nowhere.
 */
const grade = async (c: LabCtx): Promise<number> => {
    const wanted = c.lab.grade
    if (wanted === undefined) return 1
    const key = readDeviceKey(c.io.env)
    if (key === null) {
        c.io.err("This machine has no device key, so it cannot grade. Pair it again with starci-relay pair <code>.")
        return 1
    }
    if (wanted.files.some((file) => createHash("sha256").update(Buffer.from(file.content, "base64")).digest("hex") !== file.sha256)) {
        c.io.err("A hidden file does not match its hash; nothing was graded.")
        return 1
    }
    const temp = makeGradeFolder()
    const checkout = join(temp, "checkout")
    const quoted = shellPath(checkout)
    try {
        if (quoted === null) {
            c.io.err("The temporary folder has a character a shell would read; nothing was graded.")
            return 1
        }
        const added = await c.io.runCommand(`git worktree add --detach ${quoted} ${wanted.commit}`, c.root, STEP_TIMEOUT_MS, undefined, true)
        if (added.exitCode !== 0) {
            c.io.err(`Could not check out ${wanted.commit.slice(0, 10)} (exit ${added.exitCode}); nothing was graded.`)
            return 1
        }
        writeHiddenFiles(checkout, wanted.files)
        const read = await readTests(c, checkout, { ...c.env, STARCI_SEED_ORDER: wanted.seedOrder.join(",") })
        if (read.tests === null || read.tests.length === 0) {
            c.io.err("The grading run wrote no readable report; nothing was sent.")
            return 1
        }
        const statement = { submissionId: wanted.submissionId, nonce: wanted.nonce, commit: wanted.commit, tests: read.tests }
        await send(c, [
            {
                mutation: "relayLabGrade",
                input: {
                    eventId: c.io.ids(),
                    taskId: c.taskId,
                    submissionId: statement.submissionId,
                    nonce: statement.nonce,
                    commit: statement.commit,
                    tests: [...statement.tests],
                    signature: signText(key, gradeTextOf(statement)),
                },
            },
        ])
        c.io.out("Grade signed and sent to StarCi.")
        return 0
    } finally {
        await attempt(c, "delete the hidden files", () =>
            wanted.files.forEach((file) => removeTreeFile(checkout, file.path)),
        )
        if (quoted !== null)
            await attempt(c, "remove the grading worktree", () =>
                c.io.runCommand(`git worktree remove --force ${quoted}`, c.root, PROBE_TIMEOUT_MS, undefined, true),
            )
        await attempt(c, "delete the temporary folder", () => removeTree(temp))
        await attempt(c, "prune the worktree list", () =>
            c.io.runCommand("git worktree prune", c.root, PROBE_TIMEOUT_MS, undefined, true),
        )
    }
}

/**
 * Runs one lab manifest (already verified, shown and confirmed): boot, test, chaos or grade, with the uploads of each, through the
 * offline queue. Answers the exit code: 1 when the run could not do its work, 0 otherwise (a red test is a result, not a failure).
 */
export const runLab = async (
    io: CliIo,
    session: RelaySession,
    state: LabRunState,
    lab: LabSection,
): Promise<number> => {
    const host = io.labHost
    if (host === undefined) {
        io.err("This build of the CLI cannot run labs.")
        return 1
    }
    const c: LabCtx = {
        io,
        session,
        state,
        lab,
        host,
        taskId: labTaskIdOf(lab),
        runId: io.ids(),
        root: join(host.home(), "starci", lab.courseId),
        env: chaosEnvOf(lab),
    }
    labLinesOf(lab).forEach((line) => io.out(line))
    if (lab.action === "boot") return boot(c)
    if (!hasRepository(c.root)) {
        io.err(`No clone of this lab in ${c.root}. Boot the lab first.`)
        return 1
    }
    if (lab.action === "grade") return grade(c)
    if (lab.action === "chaos") {
        const up = await composeUp(c, false)
        io.out(`docker compose up: ${up.ok ? "done" : "FAILED"}${up.ok ? "" : ` (${up.detail})`}`)
        if (!up.ok) return 1
    }
    return (await testAndUpload(c, false)) === null ? 1 : 0
}
