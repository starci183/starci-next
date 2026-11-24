import { createHash } from "node:crypto"
import { caseEventInputOf, caseTaskIdOf, type CaseResetEvent } from "@modules/platform/relay-protocol"
import type { CliIo } from "./relay-client.contracts"
import { isRecord } from "./json.mapper"
import { courseOf, type LabManifest } from "./lab-manifest.policy"
import { relayGraphql } from "./relay-graphql.client"
import { flush, sessionOf } from "./task-run.cli"
import { readQueue, writeQueue } from "./upload-queue.adapter"

/**
 * The ladder rungs of a lab, fetched from StarCi one learner file at a time (owner 2026-11-25).
 *
 * The learner's checkout holds the base rung alone: shipping the ladder's tags with it would hand every reference answer, the last rung
 * included, to the learner on day 1. So `case diff` and `case reset-to` ask the server for the rungs they need, and the server decides:
 * the diff's two rungs only once it has recorded the case green for this learner, the reset's rung at any time (and it records it).
 */

/** The query of one rung of a case's reference diff. */
export const RUNG_QUERY =
    "query ($input: RelayLabRungInput!) { relayLabRung(input: $input) { kind tag path content sha256 } }"

/** The mutation that records a reset (the `case.reset` upload's input) and answers the case's own rung. */
export const RESET_TO_MUTATION =
    "mutation ($input: RelayLabCaseResetInput!) { relayLabCaseResetTo(input: $input) { kind tag path content sha256 } }"

/** One rung of the learner file as StarCi served it, its bytes checked against the hash it came with. */
export interface LabRung {
    /** The rung's tag. */
    readonly tag: string
    /** The learner file's path in the lab. */
    readonly path: string
    /** The file's text at that rung. */
    readonly content: string
}

/** What asking for a rung came to. */
export type RungFetch =
    | { readonly kind: "rung"; readonly rung: LabRung }
    /** This machine is not paired (or knows no manifest key): the rungs live on StarCi, so nothing can be fetched. */
    | { readonly kind: "unpaired"; readonly line: string }
    /** StarCi refused (a stable code such as COURSE_RUNG_LOCKED) or could not be reached (status 0). */
    | { readonly kind: "refused"; readonly code: string; readonly status: number }

/** The SHA-256 (hex) of a text's UTF-8 bytes. */
const sha256Of = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex")

/**
 * The rung of an answer, checked: the tag asked for, the learner file of this lab and the bytes the hash names. Anything else is
 * treated as no answer at all, so the relay never writes a file into the learner's checkout that is not the rung it asked for.
 */
const rungOfAnswer = (field: unknown, tag: string, learnerFile: string): LabRung | null => {
    if (!isRecord(field)) return null
    const { kind, path, content, sha256 } = field
    if (field.tag !== tag || kind !== `rung:${tag}` || path !== learnerFile || typeof content !== "string") return null
    return sha256 === sha256Of(content) ? { tag, path: learnerFile, content } : null
}

/** Runs one rung door with the device token, after the queue is flushed, and reads its answer. */
const askRung = async (
    io: CliIo,
    manifest: LabManifest,
    tag: string,
    door: "relayLabRung" | "relayLabCaseResetTo",
    input: Readonly<Record<string, unknown>>,
): Promise<RungFetch> => {
    const read = sessionOf(io)
    if (read.kind === "unpaired") return { kind: "unpaired", line: read.line }
    // The queue goes first: a green run still waiting there is exactly what the server must have recorded before it opens a diff.
    writeQueue(io.env, await flush(io, read.session, readQueue(io.env)))
    const query = door === "relayLabRung" ? RUNG_QUERY : RESET_TO_MUTATION
    const answer = await relayGraphql(io.fetch, read.session.baseUrl, read.session.token, query, { input })
    if (answer.kind === "refused") return answer
    const rung = rungOfAnswer(answer.data[door], tag, manifest.learnerFile)
    return rung === null ? { kind: "refused", code: "RELAY_RUNG_MISMATCH", status: 200 } : { kind: "rung", rung }
}

/** One rung of a case's reference diff (the rung before its fix, or its own), served only once StarCi recorded the case green. */
export const fetchDiffRung = (io: CliIo, manifest: LabManifest, caseId: string, tag: string): Promise<RungFetch> =>
    askRung(io, manifest, tag, "relayLabRung", { lessonId: manifest.lessonId, caseId, tag })

/**
 * The reset of a case: StarCi records it (the same `case.reset` the queue would carry, under a fresh client event id) and answers the
 * case's own rung. It is never queued: a reset with no rung to write would be a record of something that did not happen.
 */
export const fetchResetRung = (io: CliIo, manifest: LabManifest, tag: string, event: CaseResetEvent): Promise<RungFetch> =>
    askRung(
        io,
        manifest,
        tag,
        "relayLabCaseResetTo",
        caseEventInputOf(event, { eventId: io.ids(), taskId: caseTaskIdOf(courseOf(manifest), manifest.lessonId) }).input,
    )
