import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { PendingUpload, UploadMutation } from "./relay-client.contracts"
import { configPathOf } from "./device-settings.adapter"
import { type ConfigEnv } from "./relay-client.config"
import { isRecord, jsonOf } from "./json.mapper"

/** The upload mutations a queued item may name. */
const MUTATIONS: ReadonlySet<string> = new Set([
    "relayCheckStarted",
    "relayCheckResult",
    "relayLog",
    "relayManifestAck",
])

/** The queue file beside the config: uploads not yet accepted, resent on the next run (offline-safe). */
const queuePathOf = (env: ConfigEnv): string => join(dirname(configPathOf(env)), "queue.json")

/** True when a mutation name is one of the relay uploads. */
const isMutation = (value: unknown): value is UploadMutation => typeof value === "string" && MUTATIONS.has(value)

/** True when a queued item is a well-formed upload. */
const isPendingUpload = (item: unknown): item is PendingUpload =>
    isRecord(item) && isMutation(item.mutation) && isRecord(item.input) && typeof item.input.eventId === "string"

/** The uploads still waiting, oldest first; a missing or unreadable queue is empty. */
export const readQueue = (env: ConfigEnv): ReadonlyArray<PendingUpload> => {
    const path = queuePathOf(env)
    if (!existsSync(path)) return []
    const read = jsonOf(readFileSync(path, "utf8"))
    return read.kind === "read" && Array.isArray(read.value) ? read.value.filter((item) => isPendingUpload(item)) : []
}

/** Replaces the waiting uploads, readable by this user alone. */
export const writeQueue = (env: ConfigEnv, queue: ReadonlyArray<PendingUpload>): void => {
    const path = queuePathOf(env)
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    writeFileSync(path, `${JSON.stringify(queue)}\n`, { encoding: "utf8", mode: 0o600 })
}
