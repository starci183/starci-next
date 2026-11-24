import { caseEventInputOf, caseTaskIdOf, type CaseEvent } from "@modules/platform/relay-protocol"
import type { CliIo, PendingUpload } from "./relay-client.contracts"
import { courseOf, type LabManifest } from "./lab-manifest.policy"
import { flush, sessionOf } from "./task-run.cli"
import { readQueue, writeQueue } from "./upload-queue.adapter"

/** Where a case event went: sent now, or kept in the queue for the next run (offline, unpaired, or StarCi did not take it yet). */
export type CaseEventSent = "sent" | "queued"

/**
 * Uploads one lab case event through the relay's offline queue, behind whatever is already waiting: the queue keeps the order of the
 * learner's runs and resends each event under its own `eventId`, so a flaky network never loses or doubles a result. An unpaired
 * machine keeps the event queued and says nothing on stdout (the MCP's stdout is the JSON-RPC stream): the case loop works offline,
 * and the next paired run sends it.
 */
export const sendCaseEvent = async (io: CliIo, manifest: LabManifest, event: CaseEvent): Promise<CaseEventSent> => {
    const upload: PendingUpload = caseEventInputOf(event, {
        eventId: io.ids(),
        taskId: caseTaskIdOf(courseOf(manifest), manifest.lessonId),
    })
    const queue = [...readQueue(io.env), upload]
    const read = sessionOf(io)
    if (read.kind === "unpaired") {
        writeQueue(io.env, queue)
        return "queued"
    }
    const left = await flush(io, read.session, queue)
    writeQueue(io.env, left)
    return left.length === 0 ? "sent" : "queued"
}
