import type { CliIo, ManifestCheck, PendingUpload, VerifiedManifest } from "./relay-client.contracts"
import { conceptRunsOf, junitCasesOf, type ConceptRun } from "./junit.policy"
import { kitConfigOf } from "./project-kit.policy"
import { ensureFolderOf, readProjectFile } from "./project-kit.adapter"
import { readQueue, writeQueue } from "./upload-queue.adapter"
import { refusalLine } from "./relay-api.client"
import { LOG_TAIL_MAX, fetchManifest, flush, runChecks, sessionOf, type RelaySession } from "./task-run.cli"

/** The longest `ref` of a result: the names of the tests that ran, joined. */
const REF_MAX = 300

/** What running the test command came to. */
interface RunFacts {
    /** The exit code of the command. */
    readonly exitCode: number
    /** How long it ran, in milliseconds. */
    readonly durationMs: number
    /** The commit the project is on, when it is a git folder. */
    readonly commit: string | undefined
}

/** The commit the project is on, or undefined when it is not a git folder. */
const commitOf = async (io: CliIo, cwd: string): Promise<string | undefined> => {
    const run = await io.runCommand("git rev-parse HEAD", cwd, 10_000)
    const commit = run.output.trim()
    return run.exitCode === 0 && /^[0-9a-f]{40}$/u.test(commit) ? commit : undefined
}

/** The upload of one concept's tagged tests: a `test` slot result under the check that ran them. */
const resultOf = (
    io: CliIo,
    base: Readonly<Record<string, string>>,
    check: ManifestCheck,
    run: ConceptRun,
    facts: RunFacts,
): PendingUpload => ({
    mutation: "relayCheckResult",
    input: {
        eventId: io.ids(),
        ...base,
        checkId: check.id,
        conceptId: run.conceptId,
        slot: "test",
        ref: run.names.join("; ").slice(0, REF_MAX),
        passed: run.passed,
        exitCode: facts.exitCode,
        durationMs: facts.durationMs,
        ...(facts.commit === undefined ? {} : { commit: facts.commit }),
    },
})

/** Runs the project's test command once, reads its JUnit report, then uploads the log and a result per tagged concept. */
const runProjectCheck = async (
    io: CliIo,
    session: RelaySession,
    manifest: VerifiedManifest,
    cwd: string,
    pending: ReadonlyArray<PendingUpload>,
): Promise<number> => {
    const [check] = manifest.checks
    const { plan } = manifest
    if (check === undefined || plan === undefined) {
        io.err("The manifest StarCi signed is not a project run; nothing was run.")
        return 1
    }
    const base = { taskId: manifest.taskId, runId: io.ids() }
    const ack: PendingUpload = {
        mutation: "relayManifestAck",
        input: { eventId: io.ids(), ...base, manifestId: manifest.manifestId },
    }
    const acked = await flush(io, session, [...pending, ack])
    ensureFolderOf(cwd, plan.report)
    const [run] = await runChecks(io, [check])
    const report = readProjectFile(cwd, plan.report)
    const runs = report === null ? [] : conceptRunsOf(junitCasesOf(report), plan.concepts)
    if (report === null) io.err(`No JUnit report at ${plan.report}: the test command must write it.`)
    else if (runs.length === 0)
        io.out(`No test is tagged with a concept of ${plan.milestone}: put [concept] in the test name.`)
    const facts: RunFacts = {
        exitCode: run?.exitCode ?? -1,
        durationMs: run?.durationMs ?? 0,
        commit: await commitOf(io, cwd),
    }
    const checkBase = { ...base, checkId: check.id }
    const uploads: ReadonlyArray<PendingUpload> = [
        { mutation: "relayCheckStarted", input: { eventId: io.ids(), ...checkBase } },
        {
            mutation: "relayLog",
            input: { eventId: io.ids(), ...checkBase, text: (run?.output ?? "").slice(-LOG_TAIL_MAX) },
        },
        ...runs.map((concept) => resultOf(io, base, check, concept, facts)),
    ]
    const left = await flush(io, session, [...acked, ...uploads])
    writeQueue(io.env, left)
    runs.forEach((concept) =>
        io.out(`  ${concept.conceptId}: ${concept.passed ? "passed" : "failed"} (${concept.names.length} test(s))`),
    )
    io.out(left.length === 0 ? "Results sent to StarCi (practice)." : `${left.length} upload(s) wait for the next run.`)
    return facts.exitCode === 0 && report !== null && runs.every((concept) => concept.passed) ? 0 : 1
}

/**
 * `starci-next run <milestone>` in a project folder: reads `starci/project.yaml`, asks StarCi for the signed manifest of the
 * milestone (the learner's test command, the report path and the milestone's concepts), verifies it, shows the command and asks,
 * runs it here, reads the JUnit XML for tests tagged `[concept]` and uploads one practice result per concept.
 */
export const runProject = async (io: CliIo, milestone: string, isConfirmed: boolean, cwd: string): Promise<number> => {
    const read = sessionOf(io)
    if (read.kind === "unpaired") {
        io.err(read.line)
        return 1
    }
    const yaml = readProjectFile(cwd, "starci/project.yaml")
    const config = kitConfigOf(yaml ?? "")
    if (config.projectId === null) {
        io.err("No starci/project.yaml with a project id here. Run starci-next init --project <id> first.")
        return 1
    }
    const { session } = read
    const pending = await flush(io, session, readQueue(io.env))
    writeQueue(io.env, pending)
    const fetched = await fetchManifest(
        io,
        session,
        {
            taskId: config.projectId,
            milestone,
            ...(config.testCommand === null ? {} : { testCommand: config.testCommand }),
            ...(config.testReport === null ? {} : { testReport: config.testReport }),
        },
        io.env.STARCI_NEXT_MANIFEST_KEY ?? "",
    )
    if (fetched.kind !== "verified") {
        io.err(
            fetched.kind === "refused" ? refusalLine(fetched) : "The manifest is not signed by StarCi; nothing was run.",
        )
        return 1
    }
    const { manifest } = fetched
    io.out(`Milestone ${milestone}: ${manifest.plan?.concepts.length ?? 0} concept(s), signed by StarCi.`)
    manifest.checks.forEach((check) =>
        io.out(`  ${check.id}: ${check.command}   (in ${check.cwd}, at most ${check.timeoutMs / 1000}s)`),
    )
    if (!isConfirmed && !(await io.confirm("Run this command on this machine?"))) {
        io.out("Nothing was run.")
        return 0
    }
    return runProjectCheck(io, session, manifest, cwd, pending)
}
