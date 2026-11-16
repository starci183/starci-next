import { join } from "node:path"
import type {
    HarnessBuildSection,
    HarnessCiReportOptions,
    HarnessE2eOptions,
    HarnessPlan,
    StageOutcome,
} from "./harness.contracts"
import {
    envFileNames,
    harnessRootOf,
    ignoreEnvFile,
    readHarnessState,
    writeHarnessState,
} from "./harness-files.adapter"
import { isHarnessId, keyCheckOf, keyNamesOf, stagesAsked, type KeyCheck } from "./harness.policy"
import { stageOutcomesOf, stageTableOf } from "./harness-report.policy"
import { excludeLines, hasFolder, readText, removeFile } from "./lesson-files.adapter"
import { postHarnessCiReport } from "./ci-report.cli"
import type { CliIo, PendingUpload } from "./relay-client.contracts"
import { refusalLine } from "./relay-api.client"
import { scenarioCasesOf } from "./scenario-report.policy"
import { unpackSource } from "./source-pull.cli"
import { fetchManifest, flush, sessionOf, type RelaySession } from "./task-run.cli"
import { readQueue, writeQueue } from "./upload-queue.adapter"

/** How long the whole e2e command of a build may run. */
const E2E_TIMEOUT_MS = 1_800_000
/** How long the install command may run. */
const INSTALL_TIMEOUT_MS = 900_000
/** The longest `why` of an upload. */
const WHY_MAX = 300

/** What fetching the signed build manifest answered: the build section, or the exit code after the line was printed. */
type BuildFetch =
    | {
          readonly kind: "build"
          readonly session: RelaySession
          readonly manifestId: string
          readonly build: HarnessBuildSection
      }
    | { readonly kind: "failed" }

/** Fetches and verifies the manifest of `harness:build:<id>`; prints why and answers `failed` when nothing may run. */
const fetchBuild = async (io: CliIo, buildId: string): Promise<BuildFetch> => {
    const read = sessionOf(io)
    if (read.kind === "unpaired") {
        io.err(read.line)
        return { kind: "failed" }
    }
    const { session } = read
    writeQueue(io.env, await flush(io, session, readQueue(io.env)))
    const taskId = `harness:build:${buildId}`
    const fetched = await fetchManifest(io, session, { taskId }, io.env.STARCI_NEXT_MANIFEST_KEY ?? "")
    if (fetched.kind !== "verified") {
        io.err(
            fetched.kind === "refused"
                ? refusalLine(fetched)
                : "The manifest is not signed by StarCi; nothing was run.",
        )
        return { kind: "failed" }
    }
    const { harness } = fetched.manifest
    if (harness?.kind !== "build" || harness.buildId !== buildId) {
        io.err("StarCi sent no build for this ask; nothing was run.")
        return { kind: "failed" }
    }
    return { kind: "build", session, manifestId: fetched.manifest.manifestId, build: harness }
}

/** The names of the key needs present on this machine: `.env` names of the build folder or names set in the environment. Never values. */
const keyCheckOfRoot = (io: CliIo, root: string, plan: HarnessPlan): KeyCheck => {
    const inFile = new Set(envFileNames(root))
    return keyCheckOf(plan.keys, (name) => inFile.has(name) || io.hasEnv?.(name) === true)
}

/**
 * `starci-next harness pull <build>`: the same flow as the lesson `pull` (one shared unpack): downloads the tarball StarCi signed,
 * checks its sha256 and listing, unpacks it into `./<build>` and makes one initial commit. `.env` is put in `.gitignore` before that
 * commit and in the private git excludes, and `.starci-harness.json` (the plan, no secret) stays in git so CI can report.
 */
export const pullBuild = async (io: CliIo, buildId: string, cwd: string): Promise<number> => {
    if (!isHarnessId(buildId)) {
        io.err("A build id is lowercase letters, digits and dashes.")
        return 1
    }
    const got = await fetchBuild(io, buildId)
    if (got.kind === "failed") return 1
    const { build } = got
    const { source } = build
    const target = join(cwd, buildId)
    if (hasFolder(target)) {
        const had = readHarnessState(target)
        io.out(
            had?.sha256 === source.sha256
                ? `Build ${buildId} is already in ./${buildId} at ${source.commit.slice(0, 10)}.`
                : `./${buildId} already exists and is not this source; move it away and pull again.`,
        )
        return had?.sha256 === source.sha256 ? 0 : 1
    }
    const unpacked = await unpackSource(io, got.session, {
        noun: "build",
        source,
        target,
        dir: build.dir,
        message: `"Build ${buildId} source at ${source.commit.slice(0, 10)}"`,
        prepare: (folder) => {
            ignoreEnvFile(folder)
            writeHarnessState(folder, {
                buildId,
                commit: source.commit,
                sha256: source.sha256,
                dir: build.dir,
                install: build.install,
                e2e: build.e2e,
                report: build.report,
                keys: build.keys,
                stages: build.stages,
            })
        },
        finish: (folder) => excludeLines(folder, [".env", ".env.*", ".starci-last/"]),
    })
    if (!unpacked) return 1
    io.out(
        `Build ${buildId} is in ./${buildId} (source at ${source.commit.slice(0, 10)}, sha256 verified), one initial commit.`,
    )
    const names = keyNamesOf(build.keys)
    io.out(
        names.length === 0
            ? "This build needs no key."
            : `Put your own key in ${buildId}/.env (it never leaves this machine). Names the build looks for: ${names.join(", ")}.`,
    )
    io.out(`Next: cd ${buildId} && starci-next harness e2e --install`)
    return 0
}

/** The build folder an e2e run is for: the named build's folder, or the current folder (or its parent) when it holds a build marker. */
const buildRootOf = (cwd: string, buildId: string | undefined): string | null =>
    buildId === undefined
        ? ([cwd, join(cwd, "..")].find((folder) => readHarnessState(folder) !== null) ?? null)
        : harnessRootOf(cwd, buildId)

/** The uploads of one run: per stage `check.started` and a counts-only log, per e2e id one `harness-stage` result (contract §2.1). */
const uploadsOf = (
    io: CliIo,
    base: Readonly<Record<string, string>>,
    buildId: string,
    commit: string,
    runExit: number,
    present: ReadonlyArray<string>,
    stages: ReadonlyArray<StageOutcome>,
): ReadonlyArray<PendingUpload> =>
    stages.flatMap((stage) => {
        const ofStage = { ...base, checkId: stage.id }
        const passedCount = stage.e2e.filter((item) => item.passed).length
        return [
            { mutation: "relayCheckStarted" as const, input: { eventId: io.ids(), ...ofStage } },
            {
                mutation: "relayLog" as const,
                input: {
                    eventId: io.ids(),
                    ...ofStage,
                    text: `${passedCount}/${stage.e2e.length} e2e passed in stage ${stage.id}`,
                },
            },
            ...stage.e2e.map((item) => ({
                mutation: "relayCheckResult" as const,
                input: {
                    eventId: io.ids(),
                    ...ofStage,
                    slot: "harness-stage",
                    ref: item.id,
                    passed: item.passed,
                    exitCode: item.passed ? 0 : runExit === 0 ? 1 : runExit,
                    durationMs: item.timeMs,
                    commit,
                    buildId,
                    stageId: stage.id,
                    envPresent: present,
                    why: (item.passed ? "passed" : item.notRun ? "not run: no test carries its tag" : "failed").slice(
                        0,
                        WHY_MAX,
                    ),
                },
            })),
        ]
    })

/**
 * `starci-next harness e2e [build] [--stage n] [--install] [--yes]`: verifies the signed manifest, runs only its e2e command (once,
 * with `STARCI_STAGE` naming the asked stage when one is asked) on this machine, reads the JUnit report, prints a stage table and
 * uploads one `harness-stage` result per e2e id as practice. Key variables are checked by NAME in `.env` and the environment; no
 * value is read into the CLI, printed or uploaded, and the e2e output is never uploaded (the log is a count).
 */
export const e2eBuild = async (
    io: CliIo,
    buildId: string | undefined,
    options: HarnessE2eOptions,
    cwd: string,
): Promise<number> => {
    const root = buildRootOf(cwd, buildId)
    const state = root === null ? null : readHarnessState(root)
    if (root === null || state === null) {
        io.err(`No build here. Run starci-next harness pull ${buildId ?? "<build>"} and cd into it.`)
        return 1
    }
    const got = await fetchBuild(io, state.buildId)
    if (got.kind === "failed") return 1
    const { build } = got
    const asked = stagesAsked(build, options.stage)
    if (asked === null) {
        io.err(
            `Build ${build.buildId} has no stage ${options.stage ?? ""}; use 1 to ${build.stages.length} or a stage id.`,
        )
        return 1
    }
    if (build.source.commit !== state.commit)
        io.out(
            `Note: StarCi now signs source ${build.source.commit.slice(0, 10)}; this folder is ${state.commit.slice(0, 10)}.`,
        )
    const keys = keyCheckOfRoot(io, root, build)
    keys.missing.forEach((key) =>
        io.out(
            `Key ${key.id}: none of ${key.anyOf.join(", ")} is set (put one in ${state.buildId}/.env); stages that call the model will fail.`,
        ),
    )
    const stageIds = asked.map((item) => item.stage.id)
    io.out(`Build ${build.buildId}: ${asked.length} stage(s), signed by StarCi.`)
    if (options.install) io.out(`  install: ${build.install}   (in ${build.dir})`)
    io.out(
        `  e2e: ${build.e2e}   (in ${build.dir}, at most ${E2E_TIMEOUT_MS / 60_000} min, STARCI_STAGE=${stageIds.join(",")})`,
    )
    if (!options.yes && !(await io.confirm("Run these commands on this machine?"))) {
        io.out("Nothing was run.")
        return 0
    }
    const base = { taskId: `harness:build:${build.buildId}`, runId: io.ids() }
    const ack: PendingUpload = {
        mutation: "relayManifestAck",
        input: { eventId: io.ids(), ...base, manifestId: got.manifestId },
    }
    const acked = await flush(io, got.session, [...readQueue(io.env), ack])
    writeQueue(io.env, acked)
    if (options.install) {
        const installed = await io.runCommand(build.install, join(root, build.dir), INSTALL_TIMEOUT_MS)
        if (installed.exitCode !== 0) {
            io.err(`The install command failed (exit ${installed.exitCode}); the e2e was not run.`)
            return 1
        }
    }
    removeFile(join(root, build.report))
    const run = await io.runCommand(build.e2e, join(root, build.dir), E2E_TIMEOUT_MS, {
        STARCI_STAGE: options.stage === undefined ? "" : stageIds.join(","),
    })
    const report = readText(join(root, build.report))
    if (report === null) io.err(`No JUnit report at ${build.report}: the e2e command must write it.`)
    const stages = stageOutcomesOf(report === null ? [] : scenarioCasesOf(report), asked)
    stageTableOf(stages).forEach((line) => io.out(line))
    io.out(keys.present.length === 0 ? "Keys present: none." : `Keys present (names only): ${keys.present.join(", ")}.`)
    const left = await flush(io, got.session, [
        ...acked,
        ...uploadsOf(io, base, build.buildId, state.commit, run.exitCode, keys.present, stages),
    ])
    writeQueue(io.env, left)
    io.out(left.length === 0 ? "Results sent to StarCi (practice)." : `${left.length} upload(s) wait for the next run.`)
    return stages.every((stage) => stage.passed) && run.exitCode === 0 ? 0 : 1
}

/**
 * `starci-next harness ci-report [--report path] [--stage n]`: for a GitHub Actions run with `permissions: id-token: write`. It reads the
 * plan from `.starci-harness.json` (no device, no network to learn it), reads the JUnit report the workflow's e2e step wrote, prints
 * the stage table and posts one OIDC-attested delivery to the harness-ci door (`postHarnessCiReport`; no Project, no Premium, no secret).
 */
export const ciReportBuild = async (io: CliIo, options: HarnessCiReportOptions, cwd: string): Promise<number> => {
    const state = readHarnessState(cwd)
    if (state === null) {
        io.err("No build marker (.starci-harness.json) here; run this from the folder harness pull made.")
        return 1
    }
    const asked = stagesAsked(state, options.stage)
    if (asked === null) {
        io.err(`Build ${state.buildId} has no stage ${options.stage ?? ""}.`)
        return 1
    }
    const report = readText(join(cwd, options.report ?? state.report))
    if (report === null) {
        io.err(`No JUnit report at ${options.report ?? state.report}: run the e2e step first.`)
        return 1
    }
    const stages = stageOutcomesOf(scenarioCasesOf(report), asked)
    stageTableOf(stages).forEach((line) => io.out(line))
    return postHarnessCiReport(
        io,
        stages.flatMap((stage) =>
            stage.e2e.map((item) => ({ build: state.buildId, stage: stage.id, e2e: item.id, passed: item.passed })),
        ),
    )
}
