import { join } from "node:path"
import type { CheckRun, CliIo, PendingUpload } from "./relay-client.contracts"
import type { LastRun, LessonRunOptions, LessonScenario, LessonSection } from "./lesson.contracts"
import { fixPromptOf } from "./lesson-prompt.policy"
import {
    ARCHIVE_NAME,
    collides,
    dropArchive,
    excludeFromGit,
    makeFolder,
    removeFolder,
    writeArchive,
    hasFolder,
    lessonRootOf,
    place,
    readLast,
    readState,
    readText,
    removeFile,
    wipe,
    writeLast,
    writeState,
} from "./lesson-files.adapter"
import { isLessonId } from "./lesson.policy"
import { ARCHIVE_MAX_BYTES, archiveRefusal, hashHolds } from "./source-archive.policy"
import {
    ledgerLinesOf,
    ledgerTextOf,
    scenarioCasesOf,
    scenarioResultOf,
    type ScenarioResult,
} from "./scenario-report.policy"
import { refusalLine } from "./relay-api.client"
import { readQueue, writeQueue } from "./upload-queue.adapter"
import { LOG_TAIL_MAX, fetchManifest, flush, sessionOf, type RelaySession } from "./task-run.cli"

/** The only language of a lesson repo. */
const LANGUAGE = "typescript"
/** How long a git or docker step may take. */
const STEP_TIMEOUT_MS = 600_000

/** What fetching a lesson manifest answered: the lesson section, or the exit code after the line was printed. */
type LessonFetch =
    | {
          readonly kind: "lesson"
          readonly session: RelaySession
          readonly manifestId: string
          readonly lesson: LessonSection
      }
    | { readonly kind: "failed" }

/** Fetches and verifies the manifest of a lesson ask; prints why and answers `failed` when nothing may run. */
const fetchLesson = async (
    io: CliIo,
    lessonId: string,
    ask: { readonly scenario?: string; readonly challenge?: string },
): Promise<LessonFetch> => {
    const read = sessionOf(io)
    if (read.kind === "unpaired") {
        io.err(read.line)
        return { kind: "failed" }
    }
    const { session } = read
    writeQueue(io.env, await flush(io, session, readQueue(io.env)))
    const fetched = await fetchManifest(
        io,
        session,
        { taskId: `lesson:${lessonId}`, ...ask },
        io.env.STARCI_NEXT_MANIFEST_KEY ?? "",
    )
    if (fetched.kind !== "verified") {
        io.err(
            fetched.kind === "refused"
                ? refusalLine(fetched)
                : "The manifest is not signed by StarCi; nothing was run.",
        )
        return { kind: "failed" }
    }
    const { lesson } = fetched.manifest
    if (lesson === undefined || lesson.lessonId !== lessonId) {
        io.err("StarCi sent no lesson for this ask; nothing was run.")
        return { kind: "failed" }
    }
    return { kind: "lesson", session, manifestId: fetched.manifest.manifestId, lesson }
}

/** The URL the tarball is fetched from and whether StarCi's own bearer goes with it: a path is StarCi's own endpoint, an https URL is a signed one. */
const sourceUrlOf = (
    url: string,
    session: RelaySession,
): { readonly url: string; readonly bearer: string | undefined } =>
    url.startsWith("/") ? { url: `${session.baseUrl}${url}`, bearer: session.token } : { url, bearer: undefined }

/**
 * `starci-next pull <lesson> [--lang typescript]`: downloads the tarball of the lesson's `source/` that StarCi signed, checks its
 * sha256 and its listing (no link, no path above the folder, nothing from `hidden/`), unpacks it into `./<lesson>` and makes it a
 * git repository with one initial commit, so the learner can push it to their own GitHub for CI proof.
 */
export const pullLesson = async (
    io: CliIo,
    lessonId: string,
    lang: string | undefined,
    cwd: string,
): Promise<number> => {
    if (!isLessonId(lessonId)) {
        io.err("A lesson id is lowercase letters, digits and dashes.")
        return 1
    }
    if (lang !== undefined && lang !== LANGUAGE) {
        io.err(`Lesson sources are ${LANGUAGE} only; --lang ${lang} is not available.`)
        return 1
    }
    const got = await fetchLesson(io, lessonId, {})
    if (got.kind === "failed") return 1
    const { source, dir, compose, project } = got.lesson
    const target = join(cwd, lessonId)
    if (hasFolder(target)) {
        const had = readState(target)
        io.out(
            had?.sha256 === source.sha256
                ? `Lesson ${lessonId} is already in ./${lessonId} at ${source.commit.slice(0, 10)}.`
                : `./${lessonId} already exists and is not this source; move it away and pull again.`,
        )
        return had?.sha256 === source.sha256 ? 0 : 1
    }
    const from = sourceUrlOf(source.url, got.session)
    const answer = await io.download(from.url, from.bearer)
    if (answer.status !== 200) {
        io.err(
            answer.status === 0
                ? "StarCi could not be reached."
                : `The lesson source was refused (HTTP ${answer.status}).`,
        )
        return 1
    }
    if (
        answer.bytes.length === 0 ||
        answer.bytes.length > ARCHIVE_MAX_BYTES ||
        !hashHolds(answer.bytes, source.sha256)
    ) {
        io.err("The downloaded source does not match the sha256 StarCi signed; nothing was unpacked.")
        return 1
    }
    makeFolder(target)
    const failed = async (line: string): Promise<number> => {
        removeFolder(target)
        io.err(line)
        return 1
    }
    const step = async (command: string): Promise<CheckRun> =>
        io.runCommand(command, target, STEP_TIMEOUT_MS, undefined, true)
    writeArchive(target, answer.bytes)
    const names = await step(`tar -tzf ${ARCHIVE_NAME}`)
    const types = await step(`tar -tvzf ${ARCHIVE_NAME}`)
    const refusal =
        names.exitCode === 0 && types.exitCode === 0
            ? archiveRefusal(names.output, types.output)
            : "tar could not read it"
    if (refusal !== null) return failed(`Not unpacked: ${refusal}.`)
    if ((await step(`tar -xzf ${ARCHIVE_NAME}`)).exitCode !== 0)
        return failed("tar could not unpack the lesson source.")
    dropArchive(target)
    if (!hasFolder(join(target, dir))) return failed(`The source has no folder ${dir}; nothing was selected.`)
    const message = `"Lesson ${lessonId} source at ${source.commit.slice(0, 10)}"`
    const git = [
        "git init -q -b main",
        "git add -A",
        `git -c user.name=starci-next -c user.email=starci-next@users.noreply.invalid commit -q -m ${message}`,
    ]
    const committed = await git.reduce(
        async (ok, command) => (await ok) && (await step(command)).exitCode === 0,
        Promise.resolve(true),
    )
    if (!committed) return failed("git could not make the first commit; is git installed?")
    excludeFromGit(target)
    writeState(target, { lessonId, commit: source.commit, sha256: source.sha256, dir, compose, project })
    io.out(
        `Lesson ${lessonId} is in ./${lessonId} (source at ${source.commit.slice(0, 10)}, sha256 verified), one initial commit.`,
    )
    io.out(`Next: cd ${lessonId} && starci-next up`)
    return 0
}

/** `starci-next up|down`: docker compose of the lesson's `.docker`, composed from the signed values `pull` stored. */
export const composeLesson = async (io: CliIo, action: "up" | "down", cwd: string): Promise<number> => {
    const root = readState(cwd) === null ? join(cwd, "..") : cwd
    const state = readState(root)
    if (state === null) {
        io.err("No lesson here. Run starci-next pull <lesson> and cd into it.")
        return 1
    }
    const verb = action === "up" ? "up -d --wait" : "down"
    const run = await io.runCommand(
        `docker compose -p ${state.project} -f ${state.compose}/docker-compose.yml ${verb}`,
        root,
        STEP_TIMEOUT_MS,
    )
    io.out(
        run.exitCode === 0
            ? `docker compose ${action}: done.`
            : `docker compose ${action} failed (exit ${run.exitCode}).`,
    )
    return run.exitCode === 0 ? 0 : 1
}

/** The guards of `--guard name=off`, checked against the scenario's list: the environment to run with, or the line that refuses. */
const guardEnvOf = (
    scenario: LessonScenario,
    guards: ReadonlyArray<string>,
):
    | { readonly kind: "env"; readonly env: Readonly<Record<string, string>>; readonly names: ReadonlyArray<string> }
    | { readonly kind: "refused"; readonly line: string } => {
    const pairs = guards.map((guard) => guard.split("="))
    const bad = pairs.find(([name, value]) => value !== "off" || !scenario.guards.some((item) => item.name === name))
    if (bad !== undefined)
        return {
            kind: "refused",
            line: `Guard "${bad.join("=")}" is not one of ${scenario.id}'s guards (${scenario.guards.map((g) => g.name).join(", ") || "none"}); use name=off.`,
        }
    const named = pairs.map(([name]) => scenario.guards.find((item) => item.name === name))
    return {
        kind: "env",
        env: Object.fromEntries(named.flatMap((guard) => (guard === undefined ? [] : [[guard.env, guard.off]]))),
        names: pairs.map(([name]) => String(name)),
    }
}

/** What one scenario run left: the result, how the command ended and the uploads of it. */
interface ScenarioRun {
    readonly result: ScenarioResult
    readonly exitCode: number
    readonly uploads: ReadonlyArray<PendingUpload>
}

/** Runs one scenario's command and reads its report; the report of an earlier run is removed first. */
const runScenario = async (
    io: CliIo,
    root: string,
    lesson: LessonSection,
    scenario: LessonScenario,
    env: Readonly<Record<string, string>>,
    names: ReadonlyArray<string>,
    base: Readonly<Record<string, string>>,
    tier: string | undefined,
): Promise<ScenarioRun> => {
    removeFile(join(root, scenario.report))
    io.out(`Running ${scenario.id}: ${scenario.title}...`)
    const run = await io.runCommand(scenario.command, join(root, scenario.cwd), scenario.timeoutMs, env)
    const report = readText(join(root, scenario.report))
    if (report === null) io.err(`No JUnit report at ${scenario.report}: the command must write it.`)
    const result = scenarioResultOf(report === null ? [] : scenarioCasesOf(report), scenario)
    io.out(`  ${result.passed ? "passed" : "FAILED"} (exit ${run.exitCode}, ${run.durationMs} ms)`)
    ledgerLinesOf(result, lesson.invariants).forEach((line) => io.out(line))
    const ofCheck = { ...base, checkId: scenario.id }
    const log =
        tier === undefined
            ? run.output.slice(-LOG_TAIL_MAX)
            : `${result.tests.length} test(s), ${result.passed ? "passed" : "failed"}`
    const uploads: ReadonlyArray<PendingUpload> = [
        { mutation: "relayCheckStarted", input: { eventId: io.ids(), ...ofCheck } },
        { mutation: "relayLog", input: { eventId: io.ids(), ...ofCheck, text: log } },
        ...(result.tests.length === 0
            ? []
            : [
                  {
                      mutation: "relayCheckResult" as const,
                      input: {
                          eventId: io.ids(),
                          ...ofCheck,
                          slot: "scenario",
                          ref: `scenario:${scenario.id}`,
                          passed: result.passed && run.exitCode === 0,
                          exitCode: run.exitCode,
                          durationMs: run.durationMs,
                          commit: lesson.source.commit,
                          lessonId: lesson.lessonId,
                          scenarioId: scenario.id,
                          concepts: result.concepts,
                          guardsOff: names,
                          ...(tier === undefined ? {} : { challengeTier: tier }),
                          ...(result.why === null ? {} : { why: result.why }),
                          ...(ledgerTextOf(result) === "" || tier !== undefined
                              ? {}
                              : { ledger: ledgerTextOf(result) }),
                      },
                  },
              ]),
    ]
    return { result, exitCode: run.exitCode, uploads }
}

/** What the learner remembers of a run for `prompt`; a challenge keeps nothing. */
const lastOf = (result: ScenarioResult, names: ReadonlyArray<string>): LastRun => ({
    scenarioId: result.scenarioId,
    passed: result.passed,
    guardsOff: names,
    failing: result.failing,
    invariantIds: result.invariantIds,
})

/** The scenarios a run covers: the hidden ones of a tier, one named scenario, or (check) all; or the line that says why none. */
const pickScenarios = (
    lesson: LessonSection,
    options: LessonRunOptions,
    isCheck: boolean,
):
    | { readonly kind: "picked"; readonly scenarios: ReadonlyArray<LessonScenario> }
    | { readonly kind: "refused"; readonly line: string } => {
    if (options.challenge !== undefined) {
        const hidden = lesson.challenge
        return hidden?.tier === options.challenge && hidden.scenarios.length > 0
            ? { kind: "picked", scenarios: hidden.scenarios }
            : { kind: "refused", line: `StarCi sent no ${options.challenge} challenge for this lesson.` }
    }
    if (options.scenario === undefined)
        return isCheck
            ? { kind: "picked", scenarios: lesson.scenarios }
            : { kind: "refused", line: "Name the scenario: --scenario <id> (or --challenge <tier>)." }
    const one = lesson.scenarios.find((item) => item.id === options.scenario)
    return one === undefined
        ? { kind: "refused", line: `Lesson ${lesson.lessonId} has no scenario ${options.scenario}.` }
        : { kind: "picked", scenarios: [one] }
}

/** Runs the scenarios in order, the hidden files of a challenge on disk only while their scenario runs. */
const runAll = async (
    io: CliIo,
    root: string,
    lesson: LessonSection,
    scenarios: ReadonlyArray<LessonScenario>,
    guards: ReadonlyArray<string>,
    base: Readonly<Record<string, string>>,
    tier: string | undefined,
): Promise<ReadonlyArray<ScenarioRun>> => {
    const [scenario, ...rest] = scenarios
    if (scenario === undefined) return []
    const guarded = guardEnvOf(scenario, guards)
    if (guarded.kind === "refused") {
        io.err(guarded.line)
        return []
    }
    const placed = tier === undefined ? [] : place(root, scenario.files)
    try {
        const run = await runScenario(io, root, lesson, scenario, guarded.env, guarded.names, base, tier)
        if (tier === undefined) writeLast(root, lastOf(run.result, guarded.names))
        return [run, ...(await runAll(io, root, lesson, rest, guards, base, tier))]
    } finally {
        wipe(placed)
    }
}

/**
 * `starci-next run|check <lesson> ...`: verifies the signed manifest, runs only its scenario commands, reads the `[concept]` and
 * `[scenario:id]` tags of each report, prints the ledger and uploads one practice result per scenario.
 */
export const runLesson = async (
    io: CliIo,
    lessonId: string,
    options: LessonRunOptions,
    isCheck: boolean,
    cwd: string,
): Promise<number> => {
    const root = lessonRootOf(cwd, lessonId)
    if (!isLessonId(lessonId) || root === null) {
        io.err(`Lesson ${lessonId} is not here. Run starci-next pull ${lessonId} first.`)
        return 1
    }
    if (options.challenge !== undefined && options.scenario !== undefined) {
        io.err("Use --scenario or --challenge, not both.")
        return 1
    }
    const got = await fetchLesson(io, lessonId, {
        ...(options.scenario === undefined ? {} : { scenario: options.scenario }),
        ...(options.challenge === undefined ? {} : { challenge: options.challenge }),
    })
    if (got.kind === "failed") return 1
    const picked = pickScenarios(got.lesson, options, isCheck)
    if (picked.kind === "refused") {
        io.err(picked.line)
        return 1
    }
    if (options.challenge !== undefined && options.guards.length > 0) {
        io.err("A challenge runs with every guard on.")
        return 1
    }
    io.out(`Lesson ${lessonId}: ${picked.scenarios.length} scenario(s), signed by StarCi.`)
    picked.scenarios.forEach((scenario) =>
        io.out(
            `  ${scenario.id}: ${options.challenge === undefined ? scenario.command : "(hidden challenge command)"}   (at most ${scenario.timeoutMs / 1000}s)`,
        ),
    )
    if (picked.scenarios.some((scenario) => collides(root, scenario.files))) {
        io.err("A hidden file would overwrite one of your files; nothing was run.")
        return 1
    }
    if (!options.yes && !(await io.confirm("Run these commands on this machine?"))) {
        io.out("Nothing was run.")
        return 0
    }
    const base = { taskId: `lesson:${lessonId}`, runId: io.ids() }
    const ack: PendingUpload = {
        mutation: "relayManifestAck",
        input: { eventId: io.ids(), ...base, manifestId: got.manifestId },
    }
    const acked = await flush(io, got.session, [...readQueue(io.env), ack])
    writeQueue(io.env, acked)
    const runs = await runAll(io, root, got.lesson, picked.scenarios, options.guards, base, options.challenge)
    const left = await flush(io, got.session, [...acked, ...runs.flatMap((run) => run.uploads)])
    writeQueue(io.env, left)
    io.out(left.length === 0 ? "Results sent to StarCi (practice)." : `${left.length} upload(s) wait for the next run.`)
    const done = runs.length === picked.scenarios.length && runs.every((run) => run.result.passed && run.exitCode === 0)
    return done ? 0 : 1
}

/** `starci-next prompt <lesson> --scenario <id>`: prints the fix prompt for the learner's AI; it holds no solution. */
export const promptLesson = async (
    io: CliIo,
    lessonId: string,
    scenarioId: string | undefined,
    cwd: string,
): Promise<number> => {
    const root = lessonRootOf(cwd, lessonId)
    if (!isLessonId(lessonId) || root === null || scenarioId === undefined) {
        io.err(
            root === null
                ? `Lesson ${lessonId} is not here. Run starci-next pull ${lessonId} first.`
                : "Name the scenario: --scenario <id>.",
        )
        return 1
    }
    const got = await fetchLesson(io, lessonId, { scenario: scenarioId })
    if (got.kind === "failed") return 1
    const prompt = fixPromptOf(got.lesson, scenarioId, readLast(root, scenarioId))
    if (prompt.kind === "none") {
        io.err(prompt.line)
        return 1
    }
    io.out("Paste this into your AI:")
    io.out("----")
    io.out(prompt.text)
    io.out("----")
    return 0
}
