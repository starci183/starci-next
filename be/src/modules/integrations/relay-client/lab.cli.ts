import { createHash } from "node:crypto"
import { homedir } from "node:os"
import { join } from "node:path"
import type { CliIo, PendingUpload } from "./relay-client.contracts"
import type { LabFileSnapshot, LabHost, LabSection, LabStage, LabTest } from "./lab.contracts"
import {
    hasPath,
    hasRepository,
    isEmptyFolder,
    makeGradeFolder,
    readChaosOn,
    readDeviceKey,
    readTreeFile,
    readTreeText,
    removeTree,
    removeTreeFile,
    writeChaosOn,
    writeHiddenFiles,
} from "./lab-files.adapter"
import { excludeLines } from "./lesson-files.adapter"
import { labFolderChoiceOf, unsafeFolderLines, type LabFolderChoice } from "./lab-folder.policy"
import { readBootedFolder, readLabFolder, writeBootedFolder } from "./lab-workspace.adapter"
import { gradeTestsOf, labTestsOf, snapshotOf } from "./lab-report.policy"
import { gradeTextOf, signText, type GradeFailure } from "./lab-sign.policy"
import { installDeps } from "./lab-install.cli"
import { chaosStepsOf, labTaskIdOf } from "./lab.policy"
import { unpackSource } from "./source-pull.cli"
import { LOG_TAIL_MAX, flush, type RelaySession } from "./task-run.cli"
import { readQueue, writeQueue } from "./upload-queue.adapter"

/** How long the files may be quiet before a change is uploaded. */
export const WATCH_DEBOUNCE_MS = 400
/** The oldest Node a lab runs on. */
const MIN_NODE_MAJOR = 22
/** The least free memory a lab boots with. */
const MIN_FREE_MEM_BYTES = 1024 ** 3
/** How long a docker step may take. */
const STEP_TIMEOUT_MS = 900_000
/** How long a chaos command may take. */
const CHAOS_TIMEOUT_MS = 120_000
/** How long a quick probe (docker info, git rev-parse) may take. */
const PROBE_TIMEOUT_MS = 60_000
/** The longest detail a boot stage carries. */
const DETAIL_MAX = 300
/** The lines of a service's log the CLI asks docker for. */
const LOG_LINES = 400
/** The first characters of the signed commit the baseline commit message names. */
const COMMIT_SHOWN = 12

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
    /** The learner's lab folder, a git repository (`folderChoiceOf`: by default `<home>/starci/<course>/<lesson>`). */
    readonly root: string
    /** The project folder every command runs in: `root` joined with the manifest's `dir`. */
    readonly work: string
}

/** What one stage came to. */
interface StageResult {
    readonly ok: boolean
    readonly detail: string
}

/** The folder of a lab on a machine: `lab start --dir`, then the `learnerDir` the server signed, then the folder it booted into, then `<home>/starci/<course>/<lesson>`. */
const folderChoiceOf = (
    io: CliIo,
    home: string,
    lab: Pick<LabSection, "courseId" | "lessonId" | "learnerDir">,
): LabFolderChoice =>
    labFolderChoiceOf(lab, {
        flagged: readLabFolder(io.env, lab.courseId, lab.lessonId),
        learnerDir: lab.learnerDir,
        booted: readBootedFolder(io.env, lab.courseId, lab.lessonId),
        home,
    })

/**
 * The lab folder as the lines shown before a run name it, so what the learner is asked to confirm is where the lab really goes: the
 * folder they chose (`lab start --dir`, else the web's `learnerDir`), else the default. An unsafe `learnerDir` comes back as such, for
 * the caller to refuse before it asks anything. A build that cannot run labs (it only shows the lines) judges against the OS home.
 */
export const labFolderOf = (
    io: CliIo,
    lab: Pick<LabSection, "courseId" | "lessonId" | "learnerDir">,
): LabFolderChoice => folderChoiceOf(io, io.labHost?.home() ?? homedir(), lab)

/** The project folder inside a lab folder or a checkout of it. */
const workOf = (root: string, lab: Pick<LabSection, "dir">): string => (lab.dir === "." ? root : join(root, lab.dir))

const composeBase = (lab: LabSection): string => `docker compose -p ${lab.project} -f ${lab.compose}`

/**
 * The environment of every lab command. A lab's own scripts (its `npm test`) call a bare `docker compose`, which would take the compose
 * file's `name:` and start a second stack that collides on the ports of the one the boot started; COMPOSE_PROJECT_NAME outranks `name:`.
 */
const composeEnv = (lab: LabSection): Readonly<Record<string, string>> => ({ COMPOSE_PROJECT_NAME: lab.project })

/** Installs the lab's dependencies in a project folder before a test runs there (lab-install.cli.ts); progress goes to the terminal. */
const install = (c: LabCtx, work: string): ReturnType<typeof installDeps> =>
    installDeps(c.io, work, c.lab.test.install, { env: composeEnv(c.lab), quiet: false, say: c.io.out })

/** A folder as one shell word, or null when it holds a character a shell would read (no manifest value ever reaches it). */
const shellPath = (path: string): string | null => (/["$`%^!\r\n]/u.test(path) ? null : `"${path}"`)

/** Says one line to the learner in Vietnamese and in English, the Vietnamese first. */
const tell = (say: (line: string) => void, vi: string, en: string): void => {
    say(vi)
    say(en)
}

/** Says why a folder was refused, in both languages, and answers the exit code of a run that stops there. */
export const refuseFolder = (io: CliIo, choice: Extract<LabFolderChoice, { kind: "unsafe" }>): number => {
    const [vi, en] = unsafeFolderLines(choice)
    tell(io.err, vi, en)
    return 1
}

/** The path of the test report relative to the lab folder (git's own exclude file names paths from there). */
const reportPathOf = (lab: LabSection): string => (lab.dir === "." ? lab.test.report : `${lab.dir}/${lab.test.report}`)

/**
 * The lines that show what a lab manifest will run here: its commands come from the verified manifest alone. `folder` is the lab's
 * folder on this machine (`labFolderOf`), never a fixed `~/starci/...`: a learner who chose `--dir` must see that folder.
 */
export const labLinesOf = (lab: LabSection, folder: string): ReadonlyArray<string> => {
    const head = `Lab ${labTaskIdOf(lab)}: ${lab.action}.`
    const chaos = lab.chaosOn.length === 0 ? "none" : lab.chaosOn.join(", ")
    const tests = `  tests: ${lab.test.command}   (report ${lab.test.report}, at most ${lab.test.timeoutMs / 1000}s; one scenario: ${lab.test.scenario})`
    const where = `  in: ${lab.dir} of ${folder}`
    if (lab.action === "grade")
        return [
            head,
            `  grade: ${lab.grade?.files.length ?? 0} hidden file(s) in a clean checkout of your last commit, deleted afterwards`,
            `  grading: ${lab.grade?.command ?? ""}`,
            where,
            tests,
        ]
    if (lab.action === "boot")
        return [
            head,
            `  source: ${lab.source.url} (sha256 checked, commit ${lab.source.commit.slice(0, 10)}) into ${folder}; a folder that is already there is kept as it is`,
            ...(lab.solution === undefined ? [] : [`  solution: ${lab.solution.url} into ${folder}-solution`]),
            where,
            `  compose: ${composeBase(lab)} up -d --build`,
            `  seed: ${lab.seed === undefined ? "none" : `${lab.seed.command}   (at most ${lab.seed.timeoutMs / 1000}s)`}`,
            tests,
            `  chaos on: ${chaos}`,
            `  watching: ${lab.files.join(", ") || "no files"}`,
        ]
    return [
        head,
        where,
        ...(lab.action === "chaos"
            ? lab.chaos.map((item) => `  chaos ${item.id}: on = ${item.on}   off = ${item.off}`)
            : []),
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
    c.io.out(
        `[${name}] ${result.ok ? "done" : "FAILED"} (${durationMs} ms)${result.detail === "" ? "" : `: ${result.detail}`}`,
    )
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

/**
 * Unpacks the solution beside the lab (`<lesson>-solution`) once it is unlocked and not there yet. It is a reading copy: a folder that
 * exists is never touched, and a failure here never fails the boot (the line was printed).
 */
const solutionOf = async (c: LabCtx): Promise<string> => {
    const { solution } = c.lab
    if (solution === undefined) return ""
    const target = `${c.root}-solution`
    if (hasPath(target)) return ", solution already beside it"
    const unpacked = await unpackSource(c.io, c.session, {
        noun: "solution",
        source: solution,
        target,
        dir: c.lab.dir,
        message: `"starci: loi giai bai ${c.lab.lessonId} @ ${solution.commit.slice(0, COMMIT_SHOWN)}"`,
        finish: () => undefined,
    })
    return unpacked ? ", solution unpacked beside it" : ", the solution could not be unpacked"
}

/**
 * The source stage. A folder that holds a git repository is the learner's work and is kept as it is (nothing is fetched or
 * overwritten); a folder that exists with other content is refused; only a new boot onto a missing or empty folder downloads the
 * tarball, checks its sha256 and listing, unpacks it, runs `git init` and commits the tree as the baseline the learner commits on top of.
 */
const sourceStage = async (c: LabCtx): Promise<StageResult> => {
    const { lab, root } = c
    if (hasRepository(root)) {
        tell(
            c.io.out,
            `Thư mục ${root} đã có sẵn nên được giữ nguyên: bài làm của bạn không bị ghi đè.`,
            `${root} already exists, so it is kept as it is: your work is not overwritten.`,
        )
        return { ok: true, detail: `kept ${root}${await solutionOf(c)}` }
    }
    if (hasPath(root) && !isEmptyFolder(root)) {
        tell(
            c.io.err,
            `Thư mục ${root} đã có nội dung nhưng không phải thư mục lab của StarCi. Hãy chuyển nó đi chỗ khác rồi chạy lại.`,
            `${root} holds files but is not a StarCi lab folder. Move it away and run the lab again.`,
        )
        return { ok: false, detail: `${root} exists and is not a lab folder; nothing was unpacked.` }
    }
    const unpacked = await unpackSource(c.io, c.session, {
        noun: "lab",
        source: lab.source,
        target: root,
        dir: lab.dir,
        message: `"starci: bai ${lab.lessonId} @ ${lab.source.commit.slice(0, COMMIT_SHOWN)}"`,
        // The report the tests write must not show up as a change of a tracked file the learner committed.
        finish: (folder) => excludeLines(folder, [reportPathOf(lab)]),
    })
    if (!unpacked) return { ok: false, detail: "The lab source could not be unpacked; see the line above." }
    return {
        ok: true,
        detail: `unpacked into ${root} at ${lab.source.commit.slice(0, COMMIT_SHOWN)}${await solutionOf(c)}`,
    }
}

/** `docker compose up -d --build` of the lab's compose file, in the project folder. */
const composeUp = async (c: LabCtx): Promise<StageResult> => {
    const run = await c.io.runCommand(`${composeBase(c.lab)} up -d --build`, c.work, STEP_TIMEOUT_MS, composeEnv(c.lab))
    return run.exitCode === 0
        ? { ok: true, detail: "stack is up" }
        : { ok: false, detail: `docker compose up failed (exit ${run.exitCode}).` }
}

/** The dependency install (a seed or a test may need it), then the seed command of the manifest when it names one. */
const seedStage = async (c: LabCtx): Promise<StageResult> => {
    const installed = await install(c, c.work)
    if (!installed.ok) return installed
    // Only a real install is worth a word on the boot line; a project with nothing to install keeps the plain seed detail.
    const prefix = installed.detail === "dependencies installed" ? `${installed.detail}, ` : ""
    const { seed } = c.lab
    if (seed === undefined) return { ok: true, detail: `${prefix}no seed` }
    const run = await c.io.runCommand(seed.command, c.work, seed.timeoutMs, composeEnv(c.lab))
    return run.exitCode === 0
        ? { ok: true, detail: `${prefix}seeded` }
        : { ok: false, detail: `seed failed (exit ${run.exitCode}).` }
}

/**
 * Brings the chaos of the running stack from `before` to `after`: the `off` command of each switch that leaves and then the `on` command
 * of each that enters, each in the project folder, one after the other. What is on is written down after every command, so a failure
 * leaves a true record; the first failing command stops it. Answers whether every command passed.
 */
const applyChaos = async (c: LabCtx, before: ReadonlyArray<string>, after: ReadonlyArray<string>): Promise<boolean> => {
    const steps = chaosStepsOf(c.lab, before, after)
    const outcome = await steps.reduce<Promise<{ readonly ok: boolean; readonly on: ReadonlyArray<string> }>>(
        async (held, step) => {
            const so = await held
            if (!so.ok) return so
            c.io.out(`chaos ${step.id} ${step.turn}: ${step.command}`)
            const run = await c.io.runCommand(step.command, c.work, CHAOS_TIMEOUT_MS, composeEnv(c.lab))
            if (run.exitCode !== 0) {
                c.io.err(`The command that turns ${step.id} ${step.turn} failed (exit ${run.exitCode}).`)
                return { ok: false, on: so.on }
            }
            const on = step.turn === "on" ? [...so.on, step.id] : so.on.filter((id) => id !== step.id)
            writeChaosOn(c.root, on)
            return { ok: true, on }
        },
        Promise.resolve({ ok: true, on: before }),
    )
    return outcome.ok
}

/** What the test command left: how it ended and the tests of its report, null when no report could be read. */
interface TestRead {
    readonly exitCode: number
    readonly report: string | null
}

/**
 * Runs a test command in a project folder with an environment and reads its JUnit report at `reportPath` (the lab's test report, or the
 * grader's own); the report of an earlier run is removed first.
 */
const runReport = async (
    c: LabCtx,
    cwd: string,
    command: string,
    env: Readonly<Record<string, string>> | undefined,
    reportPath: string = c.lab.test.report,
): Promise<TestRead> => {
    removeTreeFile(cwd, reportPath)
    c.io.out(`Running tests: ${command}`)
    const run = await c.io.runCommand(command, cwd, c.lab.test.timeoutMs, { ...composeEnv(c.lab), ...env })
    const report = readTreeText(cwd, reportPath)
    if (report === null) c.io.err(`No JUnit report at ${reportPath}: the test command must write it.`)
    else c.io.out(`  finished (exit ${run.exitCode}, ${run.durationMs} ms)`)
    return { exitCode: run.exitCode, report }
}

/** The commit the learner's lab folder stands on (40 hex), or null when git does not say. */
const headCommit = async (c: LabCtx): Promise<string | null> => {
    const run = await c.io.runCommand("git rev-parse HEAD", c.root, PROBE_TIMEOUT_MS, undefined, true)
    const head = run.output.trim()
    return run.exitCode === 0 && /^[0-9a-f]{40}$/u.test(head) ? head : null
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
    const files: ReadonlyArray<LabFileSnapshot> = snapshotOf(paths, c.lab.files, (path) => readTreeFile(c.work, path))
    if (files.length === 0) return
    const commit = await headCommit(c)
    if (commit === null) return
    await send(c, [
        {
            mutation: "relayLabFiles",
            input: {
                eventId: c.io.ids(),
                taskId: c.taskId,
                runId: c.runId,
                commit,
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
            c.work,
            PROBE_TIMEOUT_MS,
            composeEnv(c.lab),
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

/** Runs the tests of the lab folder and sends lab.tests, the files when asked, then the logs; answers the tests, null when none could be read. */
const testAndUpload = async (c: LabCtx, withFiles: boolean): Promise<ReadonlyArray<LabTest> | null> => {
    // A no-op once the boot installed (the stamp matches); it covers a folder whose node_modules was removed since.
    if (!(await install(c, c.work)).ok) return null
    const read = await runReport(c, c.work, c.lab.test.command, undefined)
    const tests = read.report === null ? null : labTestsOf(read.report)
    if (tests !== null) {
        c.io.out(`  ${tests.filter((test) => test.passed).length}/${tests.length} test(s) passed`)
        const commit = await headCommit(c)
        if (commit === null) c.io.err("The lab folder has no readable commit; the result was not sent.")
        else await send(c, [uploadTests(c, commit, tests)])
    }
    if (withFiles) await uploadFiles(c, c.lab.files)
    await uploadLogs(c)
    return tests
}

/** Watches the lab's files; after 400 ms of quiet the changed ones are uploaded. */
const startWatch = (c: LabCtx): void => {
    stopLabWatch(c.state)
    if (c.lab.files.length === 0) return
    const dirty = new Set<string>()
    let generation = 0
    c.state.watcher = c.host.watch(c.work, c.lab.files, (path) => {
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

/** The first run of a boot: the chaos that is on is switched on in the fresh stack, then the tests run. */
const firstRunStage = async (c: LabCtx): Promise<StageResult> => {
    writeChaosOn(c.root, [])
    if (!(await applyChaos(c, [], c.lab.chaosOn))) return { ok: false, detail: "A chaos command failed." }
    const tests = await testAndUpload(c, true)
    return tests === null || tests.length === 0
        ? { ok: false, detail: "The test command wrote no readable report." }
        : { ok: true, detail: `${tests.filter((test) => test.passed).length}/${tests.length} tests pass` }
}

/** The boot: machine, source, compose, seed, first run; each stage reports running then done or failed, and the first failure ends it. */
const boot = async (c: LabCtx): Promise<number> => {
    stopLabWatch(c.state)
    // Recorded before the stages, not after: a grade manifest carries no learnerDir, and it must look where this boot put the lab even
    // when a later stage failed and the learner fixed it by hand.
    writeBootedFolder(c.io.env, c.lab.courseId, c.lab.lessonId, c.root)
    const stages: ReadonlyArray<readonly [LabStage, () => Promise<StageResult>]> = [
        ["machine", () => machineStage(c)],
        ["clone", () => sourceStage(c)],
        ["compose", () => composeUp(c)],
        ["seed", () => seedStage(c)],
        ["first-run", () => firstRunStage(c)],
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
 * Why a lab folder cannot be graded yet, or null when HEAD is a commit with no change to a tracked file waiting. The grade runs on the
 * commit, so work that is not committed would be left out of it and would not match the stack the tests run against.
 */
const gradeRefusal = async (c: LabCtx): Promise<{ readonly line: string; readonly failure: GradeFailure } | null> => {
    const status = await c.io.runCommand(
        "git status --porcelain --untracked-files=no",
        c.root,
        PROBE_TIMEOUT_MS,
        undefined,
        true,
    )
    if (status.exitCode !== 0) return { line: "git could not read the state of the lab folder.", failure: "run-failed" }
    if (status.output.trim() === "") return null
    tell(
        c.io.err,
        'Bạn còn thay đổi chưa commit trong các file đã được theo dõi. Hãy commit trước rồi nộp lại: git add -A && git commit -m "bài làm"',
        'You have uncommitted changes to tracked files. Commit first, then submit again: git add -A && git commit -m "my work"',
    )
    return { line: "uncommitted changes to tracked files.", failure: "uncommitted" }
}

/**
 * Sends a signed statement that the grading could not judge the commit, so the submission ends at once with its reason instead of
 * staying "running" until the server's 15-minute timeout blocks every resubmit. It is signed like a result (same nonce, same key), so
 * only this device can end its own submission, and it carries no test.
 */
const sendGradeFailure = async (
    c: LabCtx,
    key: string,
    wanted: NonNullable<LabSection["grade"]>,
    commit: string,
    failure: GradeFailure,
): Promise<number> => {
    const statement = { submissionId: wanted.submissionId, nonce: wanted.nonce, commit, tests: [], failure }
    await send(c, [
        {
            mutation: "relayLabGrade",
            input: {
                eventId: c.io.ids(),
                taskId: c.taskId,
                runId: c.runId,
                submissionId: statement.submissionId,
                nonce: statement.nonce,
                commit: statement.commit,
                tests: [],
                failure,
                signature: signText(key, gradeTextOf(statement)),
            },
        },
    ])
    tell(
        c.io.err,
        `Đã báo StarCi: lần chấm này không chấm được (${failure}). Sửa lỗi ở trên rồi nộp lại.`,
        `StarCi was told this grading could not run (${failure}). Fix the error above, then submit again.`,
    )
    return 1
}

/** The commit of a statement made with no lab to read one from: the server checks it is 40 hex before it reads the failure. */
const NO_COMMIT = "0".repeat(40)

/**
 * A grade for a lab that is not on this machine: it tells StarCi so (`lab-not-found`), signed like any result, because staying silent
 * leaves the submission "running" until the server's timeout and blocks every resubmit. Without a device key nothing can be signed.
 */
const endGradeWithoutLab = async (c: LabCtx): Promise<number> => {
    const key = readDeviceKey(c.io.env)
    if (key === null || c.lab.grade === undefined) return 1
    return sendGradeFailure(c, key, c.lab.grade, NO_COMMIT, "lab-not-found")
}

/**
 * The grade: the commit is the learner's own `git rev-parse HEAD` and the tracked files must be committed; a clean checkout of it is made
 * in a temporary folder (a detached worktree, never the working tree), the hidden files are verified against their hashes and written to
 * their paths, the grading command runs there with the seed order in STARCI_SEED_ORDER, and each hidden id is read from the report by its
 * `[scenario:<id>]` tag. The hidden files and the worktree are deleted whatever happened, and the result is signed with the device key and
 * uploaded. The hidden files' content is uploaded nowhere.
 */
const grade = async (c: LabCtx): Promise<number> => {
    const wanted = c.lab.grade
    if (wanted === undefined) return 1
    const key = readDeviceKey(c.io.env)
    if (key === null) {
        c.io.err("This machine has no device key, so it cannot grade. Pair it again with starci-relay pair <code>.")
        return 1
    }
    const commit = await headCommit(c)
    if (commit === null) {
        c.io.err("The lab folder has no commit to grade; nothing was graded.")
        return 1
    }
    if (
        wanted.files.some(
            (file) => createHash("sha256").update(Buffer.from(file.content, "base64")).digest("hex") !== file.sha256,
        )
    ) {
        c.io.err("A hidden file does not match its hash; nothing was graded.")
        return sendGradeFailure(c, key, wanted, commit, "run-failed")
    }
    const refusal = await gradeRefusal(c)
    if (refusal !== null) {
        c.io.err(`Nothing was graded: ${refusal.line}`)
        return sendGradeFailure(c, key, wanted, commit, refusal.failure)
    }
    const temp = makeGradeFolder()
    const checkout = join(temp, "checkout")
    const quoted = shellPath(checkout)
    try {
        if (quoted === null) {
            c.io.err("The temporary folder has a character a shell would read; nothing was graded.")
            return await sendGradeFailure(c, key, wanted, commit, "run-failed")
        }
        const added = await c.io.runCommand(
            `git worktree add --detach ${quoted} ${commit}`,
            c.root,
            STEP_TIMEOUT_MS,
            undefined,
            true,
        )
        if (added.exitCode !== 0) {
            c.io.err(`Could not check out ${commit.slice(0, 10)} (exit ${added.exitCode}); nothing was graded.`)
            return await sendGradeFailure(c, key, wanted, commit, "run-failed")
        }
        const work = workOf(checkout, c.lab)
        writeHiddenFiles(work, wanted.files)
        // The checkout holds the committed source only, so the grader's tools (jest) are installed into it; node_modules is ignored by
        // git and the whole folder is deleted below, so the source graded stays exactly the commit.
        if (!(await install(c, work)).ok) return await sendGradeFailure(c, key, wanted, commit, "run-failed")
        const read = await runReport(
            c,
            work,
            wanted.command,
            { STARCI_SEED_ORDER: wanted.seedOrder.join(",") },
            wanted.report ?? c.lab.test.report,
        )
        if (read.report === null) {
            c.io.err("The grading run wrote no readable report.")
            return await sendGradeFailure(c, key, wanted, commit, "no-readable-report")
        }
        const tests = gradeTestsOf(read.report, wanted.seedOrder)
        const statement = { submissionId: wanted.submissionId, nonce: wanted.nonce, commit, tests }
        await send(c, [
            {
                mutation: "relayLabGrade",
                input: {
                    eventId: c.io.ids(),
                    taskId: c.taskId,
                    runId: c.runId,
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
            wanted.files.forEach((file) => removeTreeFile(workOf(checkout, c.lab), file.path)),
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
    const folder = folderChoiceOf(io, host.home(), lab)
    if (folder.kind === "unsafe") return refuseFolder(io, folder)
    const root = folder.path
    const c: LabCtx = {
        io,
        session,
        state,
        lab,
        host,
        taskId: labTaskIdOf(lab),
        runId: io.ids(),
        root,
        work: workOf(root, lab),
    }
    labLinesOf(lab, root).forEach((line) => io.out(line))
    if (lab.action === "boot") return boot(c)
    if (!hasRepository(c.root)) {
        tell(
            io.err,
            `Chưa có thư mục lab ${c.root}. Hãy khởi động lab trước.`,
            `No lab folder in ${c.root}. Boot the lab first.`,
        )
        return lab.action === "grade" ? endGradeWithoutLab(c) : 1
    }
    if (lab.action === "grade") return grade(c)
    if (lab.action === "chaos" && !(await applyChaos(c, readChaosOn(c.root), lab.chaosOn))) return 1
    return (await testAndUpload(c, false)) === null ? 1 : 0
}
