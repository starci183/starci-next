import {
    RelayRefusalCode,
    type CheckRun,
    type CliIo,
    type ManifestCheck,
    type ManifestFetch,
    type PendingUpload,
} from "./relay-client.contracts"
import { readConfig } from "./device-settings.adapter"
import { isRecord } from "./json.mapper"
import { refusalLine } from "./relay-api.client"
import { MANIFEST_QUERY, relayGraphql, uploadMutationOf } from "./relay-graphql.client"
import { readQueue, writeQueue } from "./upload-queue.adapter"

/** The longest log tail one upload carries. */
export const LOG_TAIL_MAX = 16_000

/** Where the CLI talks to StarCi, as the paired device. */
export interface RelaySession {
    /** The StarCi app origin. */
    readonly baseUrl: string
    /** This device's bearer token. */
    readonly token: string
}

/** What looking for this machine's device session answered: the session, or the line that says why there is none. */
export type SessionRead =
    { readonly kind: "session"; readonly session: RelaySession } | { readonly kind: "unpaired"; readonly line: string }

/**
 * Sends the waiting uploads in order. An accepted one leaves the queue; one StarCi refuses as malformed is dropped (resending
 * cannot fix it); the first that fails otherwise stays, with the rest behind it, for the next run.
 */
export const flush = async (
    io: CliIo,
    session: RelaySession,
    queue: ReadonlyArray<PendingUpload>,
): Promise<ReadonlyArray<PendingUpload>> => {
    const [next, ...rest] = queue
    if (next === undefined) return []
    const answer = await relayGraphql(io.fetch, session.baseUrl, session.token, uploadMutationOf(next.mutation), {
        input: next.input,
    })
    if (answer.kind === "data" || answer.code === RelayRefusalCode.PayloadInvalid) return flush(io, session, rest)
    return queue
}

/** Fetches a task's manifest and verifies StarCi's signature over it. */
export const fetchManifest = async (
    io: CliIo,
    session: RelaySession,
    input: Readonly<Record<string, string>> & { readonly taskId: string },
    publicKey: string,
): Promise<ManifestFetch> => {
    const { taskId } = input
    const answer = await relayGraphql(io.fetch, session.baseUrl, session.token, MANIFEST_QUERY, { input })
    if (answer.kind === "refused") return answer
    const signed = isRecord(answer.data.relayManifest) ? answer.data.relayManifest : {}
    const { payload, signature } = signed
    if (typeof payload !== "string" || typeof signature !== "string") return { kind: "unsigned" }
    const read = io.verify(payload, signature, publicKey)
    return read.kind === "verified" && read.manifest.taskId === taskId ? read : { kind: "unsigned" }
}

/** Runs the checks one after the other, each printed as it starts and ends. */
export const runChecks = async (io: CliIo, checks: ReadonlyArray<ManifestCheck>): Promise<ReadonlyArray<CheckRun>> => {
    const [check, ...rest] = checks
    if (check === undefined) return []
    io.out(`Running ${check.id}...`)
    const run = await io.runCommand(check.command, check.cwd, check.timeoutMs)
    io.out(`  ${run.exitCode === 0 ? "passed" : "failed"} (exit ${run.exitCode}, ${run.durationMs} ms)`)
    return [run, ...(await runChecks(io, rest))]
}

/** The uploads of one check: started, its log tail and its result, each under its own client event id. */
const uploadsOf = (
    io: CliIo,
    base: Readonly<Record<string, string>>,
    check: ManifestCheck,
    run: CheckRun,
): ReadonlyArray<PendingUpload> => {
    const ofCheck = { ...base, checkId: check.id }
    const result = {
        passed: run.exitCode === 0,
        exitCode: run.exitCode,
        durationMs: run.durationMs,
        slot: "test",
        ref: check.id,
    }
    return [
        { mutation: "relayCheckStarted", input: { eventId: io.ids(), ...ofCheck } },
        { mutation: "relayLog", input: { eventId: io.ids(), ...ofCheck, text: run.output.slice(-LOG_TAIL_MAX) } },
        { mutation: "relayCheckResult", input: { eventId: io.ids(), ...ofCheck, ...result } },
    ]
}

/** The device session of this machine, or the line that says why there is none. */
export const sessionOf = (io: CliIo): SessionRead => {
    const config = readConfig(io.env)
    if (config.deviceToken === undefined)
        return { kind: "unpaired", line: "This machine is not paired. Run starci-next login." }
    if (!io.env.STARCI_NEXT_MANIFEST_KEY)
        return {
            kind: "unpaired",
            line: "No StarCi manifest key is configured (STARCI_NEXT_MANIFEST_KEY); unsigned checks are never run.",
        }
    return { kind: "session", session: { baseUrl: config.baseUrl, token: config.deviceToken } }
}

/**
 * Runs a task's signed checks on this machine: fetches the manifest, verifies StarCi's signature, shows every command and
 * asks before running it, then uploads the ack, started, log and result events as practice. Uploads that do not go through
 * wait in the queue and are resent first on the next run, each under the same client event id, so nothing counts twice.
 */
export const runTask = async (io: CliIo, taskId: string, isConfirmed: boolean): Promise<number> => {
    const read = sessionOf(io)
    if (read.kind === "unpaired") {
        io.err(read.line)
        return 1
    }
    const { session } = read
    const pending = await flush(io, session, readQueue(io.env))
    writeQueue(io.env, pending)
    const fetched = await fetchManifest(io, session, { taskId }, io.env.STARCI_NEXT_MANIFEST_KEY ?? "")
    if (fetched.kind !== "verified") {
        io.err(
            fetched.kind === "refused"
                ? refusalLine(fetched)
                : "The task manifest is not signed by StarCi; nothing was run.",
        )
        return 1
    }
    const { manifest } = fetched
    io.out(`Task ${taskId}: ${manifest.checks.length} check(s), signed by StarCi.`)
    manifest.checks.forEach((check) =>
        io.out(`  ${check.id}: ${check.command}   (in ${check.cwd}, at most ${check.timeoutMs / 1000}s)`),
    )
    if (!isConfirmed && !(await io.confirm("Run these commands on this machine?"))) {
        io.out("Nothing was run.")
        return 0
    }
    const base = { taskId, runId: io.ids() }
    const ack: PendingUpload = {
        mutation: "relayManifestAck",
        input: { eventId: io.ids(), ...base, manifestId: manifest.manifestId },
    }
    const acked = await flush(io, session, [...pending, ack])
    writeQueue(io.env, acked)
    const runs = await runChecks(io, manifest.checks)
    const uploads = runs.flatMap((run, index) => {
        const check = manifest.checks[index]
        return check === undefined ? [] : uploadsOf(io, base, check, run)
    })
    const left = await flush(io, session, [...acked, ...uploads])
    writeQueue(io.env, left)
    io.out(left.length === 0 ? "Results sent to StarCi (practice)." : `${left.length} upload(s) wait for the next run.`)
    return runs.every((run) => run.exitCode === 0) ? 0 : 1
}
