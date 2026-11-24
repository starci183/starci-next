import { isRecord, jsonOf } from "./json.mapper"
import { isLessonId } from "./lesson.policy"

/** How old a pushed run request may be, in milliseconds. */
export const REQUEST_MAX_AGE_MS: number = 15 * 60_000
/** How far ahead of this machine's clock a request may be dated. */
const CLOCK_SKEW_MS = 60_000

/** What reading a pushed frame answered: a run request, or why it is ignored. */
export type RunRequestRead =
    | {
          readonly kind: "request"
          readonly manifestId: string
          readonly lessonId: string
          readonly scenarioId: string
          readonly guards: ReadonlyArray<string>
      }
    | { readonly kind: "ignored"; readonly reason: string }

const COMMAND = /^starci-relay run ([a-z0-9-]+) --scenario ([a-z0-9-]+)((?: --guard [a-z0-9-]+=off)*)$/u
const GUARD = / --guard ([a-z0-9-]+)=off/gu

/** The `manifest` frame's signed text and signature, or null for any other frame. */
export const manifestFrameOf = (frame: unknown): { readonly payload: string; readonly signature: string } | null => {
    if (!isRecord(frame) || frame.type !== "manifest" || !isRecord(frame.manifest)) return null
    const { payload, signature } = frame.manifest
    return typeof payload === "string" && typeof signature === "string" ? { payload, signature } : null
}

/**
 * Reads the run request of a manifest whose signature was already verified: it must be for a lesson, name this device, be fresh
 * and carry exactly one check whose command is `starci-relay run <lesson> --scenario <id> [--guard <g>=off]...` for that same
 * lesson and scenario. The command is never executed as text; it only says which scenario the learner is asked to run.
 */
export const runRequestOf = (payload: string, deviceId: string | undefined, nowMs: number): RunRequestRead => {
    const read = jsonOf(payload)
    if (read.kind !== "read" || !isRecord(read.value)) return { kind: "ignored", reason: "unreadable payload" }
    const { manifestId, taskId, deviceId: target, issuedAt, checks } = read.value
    if (typeof manifestId !== "string" || typeof taskId !== "string" || !taskId.startsWith("lesson:"))
        return { kind: "ignored", reason: "not a lesson run request" }
    if (deviceId !== undefined && target !== deviceId) return { kind: "ignored", reason: "issued to another device" }
    const issued = typeof issuedAt === "string" ? Date.parse(issuedAt) : Number.NaN
    if (!Number.isFinite(issued) || nowMs - issued > REQUEST_MAX_AGE_MS || issued - nowMs > CLOCK_SKEW_MS)
        return { kind: "ignored", reason: "stale request" }
    const check = Array.isArray(checks) && checks.length === 1 ? checks[0] : undefined
    const matched = isRecord(check) && typeof check.command === "string" ? COMMAND.exec(check.command) : null
    if (matched === null) return { kind: "ignored", reason: "not a starci-relay run command" }
    const lessonId = String(matched[1])
    const scenarioId = String(matched[2])
    const guards = [...String(matched[3]).matchAll(GUARD)].map((guard) => String(guard[1]))
    if (!isLessonId(lessonId) || `lesson:${lessonId}` !== taskId || !isRecord(check) || check.id !== scenarioId)
        return { kind: "ignored", reason: "command does not match its task" }
    return { kind: "request", manifestId, lessonId, scenarioId, guards }
}
