import type { CliIo } from "./relay-client.contracts"
import { runLesson } from "./lesson.cli"
import { labRequestOf, manifestFrameOf, runRequestOf, type RunRequestRead } from "./listen.policy"
import { labAskLine, labLinesOf, newLabState, runLab, stopLabWatch, type LabRunState } from "./lab.cli"
import type { LabSection } from "./lab.contracts"
import { manifestKeyOf } from "./manifest-key.policy"
import { sessionOf, type RelaySession } from "./task-run.cli"

/** The options of `starci-relay listen`. */
export interface ListenOptions {
    /** Run what StarCi asks without the y/N question. Only an explicit flag does this. */
    readonly autoConfirm: boolean
}

/** What the frame loop needs to remember between frames. */
interface ListenState {
    /** The device the relay greeted this connection with, once it did. */
    deviceId: string | undefined
    /** The manifests already handled: a resumed socket may deliver one twice. */
    readonly seen: Set<string>
    /** The runs one after another: two requests never run at once. */
    chain: Promise<void>
    /** The paired device's session, which the lab uploads use. */
    readonly session: RelaySession
    /** What the labs keep between requests: the file watcher and the upload order. */
    readonly lab: LabRunState
}

/** The line that asks the learner: the lesson, the scenario and the guards the run switches off. */
const askLine = (request: Extract<RunRequestRead, { kind: "request" }>): string =>
    `StarCi (your AI asked) wants to run lesson ${request.lessonId}, scenario ${request.scenarioId}` +
    `${request.guards.length === 0 ? "" : `, guards off: ${request.guards.join(", ")}`} on this machine. Run it?`

/** Handles one confirmed or refused request: the same verified path as `run`, which fetches a fresh signed manifest itself. */
const handleRequest = async (
    io: CliIo,
    options: ListenOptions,
    cwd: string,
    request: Extract<RunRequestRead, { kind: "request" }>,
): Promise<void> => {
    if (!options.autoConfirm && !(await io.confirm(askLine(request)))) {
        io.out("Not run.")
        return
    }
    if (options.autoConfirm) io.out(`Auto-confirmed: ${request.lessonId} ${request.scenarioId}.`)
    await runLesson(
        io,
        request.lessonId,
        { scenario: request.scenarioId, guards: request.guards.map((guard) => `${guard}=off`), yes: true },
        false,
        cwd,
    )
}

/** Handles one lab request: shows what it will run, asks (unless --auto-confirm) and runs it. */
const handleLabRequest = async (io: CliIo, options: ListenOptions, state: ListenState, lab: LabSection): Promise<void> => {
    if (!options.autoConfirm) {
        labLinesOf(lab).forEach((line) => io.out(line))
        if (!(await io.confirm(labAskLine(lab)))) {
            io.out("Not run.")
            return
        }
    } else io.out(`Auto-confirmed: ${labAskLine(lab)}`)
    await runLab(io, state.session, state.lab, lab)
}

/** Takes one pushed frame: the greeting names the device, a manifest is verified and read, anything else is ignored. */
const handleFrame = (
    io: CliIo,
    options: ListenOptions,
    cwd: string,
    state: ListenState,
    key: string,
    frame: unknown,
): void => {
    if (typeof frame === "object" && frame !== null && (frame as { type?: unknown }).type === "hello") {
        const { deviceId } = frame as { deviceId?: unknown }
        if (typeof deviceId === "string") state.deviceId = deviceId
        return
    }
    const signed = manifestFrameOf(frame)
    if (signed === null) return
    const verified = io.verify(signed.payload, signed.signature, key)
    if (verified.kind !== "verified") {
        io.err("Ignored a run request that StarCi did not sign.")
        return
    }
    const lab = verified.manifest.lab
    if (lab !== undefined) {
        const labRequest = labRequestOf(signed.payload, lab, state.deviceId, io.now())
        if (labRequest.kind === "ignored") {
            io.err(`Ignored a pushed manifest: ${labRequest.reason}.`)
            return
        }
        if (state.seen.has(labRequest.manifestId)) return
        state.seen.add(labRequest.manifestId)
        state.chain = state.chain
            .then(() => handleLabRequest(io, options, state, labRequest.lab))
            .catch((error: unknown) =>
                io.err(`The lab run failed: ${error instanceof Error ? error.message : "unknown error"}.`),
            )
        return
    }
    const request = runRequestOf(signed.payload, state.deviceId, io.now())
    if (request.kind === "ignored") {
        io.err(`Ignored a pushed manifest: ${request.reason}.`)
        return
    }
    if (state.seen.has(request.manifestId)) return
    state.seen.add(request.manifestId)
    state.chain = state.chain
        .then(() => handleRequest(io, options, cwd, request))
        .catch((error: unknown) =>
            io.err(`The run failed: ${error instanceof Error ? error.message : "unknown error"}.`),
        )
}

/**
 * `starci-relay listen`: connects to the push-only device socket and, for each `request_run` manifest the relay pushes, verifies
 * its signature, asks the learner (lesson, scenario, guards) and runs it through `run`'s own verified path, which uploads the
 * results. Without a terminal it refuses unless `--auto-confirm` was given. Answers the exit code when the socket ends for good.
 */
export const listenCommand = async (io: CliIo, options: ListenOptions, cwd: string): Promise<number> => {
    const read = sessionOf(io)
    if (read.kind === "unpaired") {
        io.err(read.line)
        return 1
    }
    if (!options.autoConfirm && !io.isTty()) {
        io.err(
            "There is no terminal to ask you in, so listen will not run anything. Run it in a terminal, or pass --auto-confirm to run what StarCi asks without a question.",
        )
        return 1
    }
    const state: ListenState = {
        deviceId: undefined,
        seen: new Set(),
        chain: Promise.resolve(),
        session: read.session,
        lab: newLabState(),
    }
    const connection = io.listen(read.session.baseUrl, read.session.token, {
        onFrame: (frame) => handleFrame(io, options, cwd, state, manifestKeyOf(io.env, read.session.baseUrl), frame),
        onStatus: (line) => io.out(`Relay: ${line}.`),
    })
    io.out("Listening for run requests from StarCi. Press Ctrl-C to stop.")
    const reason = await connection.ended
    await state.chain
    stopLabWatch(state.lab)
    if (reason === "closed") return 0
    io.err(reason)
    return 1
}
