import type { CliIo, PendingUpload } from "./relay-client.contracts"
import { readConfig } from "./device-settings.adapter"
import { readQueue, writeQueue } from "./upload-queue.adapter"
import { flush } from "./task-run.cli"

/**
 * Sends harness results (a doctor probe, a trial verdict) as `relayHarnessResult` uploads, after the ones still waiting. Nothing but the
 * given inputs is sent. An unpaired machine sends nothing; an upload that does not go through waits in the queue for the next run.
 * Answers the line to print.
 */
export const uploadHarness = async (
    io: CliIo,
    inputs: ReadonlyArray<Readonly<Record<string, unknown>>>,
): Promise<string> => {
    const config = readConfig(io.env)
    if (config.deviceToken === undefined) return "Not paired (starci-next login): the result stays on this machine."
    const uploads: ReadonlyArray<PendingUpload> = inputs.map((input) => ({
        mutation: "relayHarnessResult",
        input: { eventId: io.ids(), ...input },
    }))
    const left = await flush(io, { baseUrl: config.baseUrl, token: config.deviceToken }, [
        ...readQueue(io.env),
        ...uploads,
    ])
    writeQueue(io.env, left)
    return left.length === 0
        ? "Result sent to StarCi (readiness, not proof)."
        : `${left.length} upload(s) wait for the next run.`
}
