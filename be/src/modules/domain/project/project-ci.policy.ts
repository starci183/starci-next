import { createHmac, timingSafeEqual } from "node:crypto"
import { isRecord } from "@modules/platform/primitives"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { EVIDENCE_SLOTS, type EvidenceSlot } from "./project.contracts"

/** The prefix of the signature header, as the other webhooks of the app write it. */
export const CI_SIGNATURE_PREFIX = "sha256="

/** The most results one CI delivery may carry. */
export const CI_RESULTS_MAX = 500

const RUN_ID = /^[\w.:-]{1,100}$/u
const COMMIT = /^[0-9a-f]{7,64}$/iu
const CONCEPT_ID = /^[a-z0-9-]{1,64}$/u
const REF_MAX = 300

/** One result of the signed document: a concept's tagged test, e2e flow or probe. */
export interface CiResult {
    /** The concept id. */
    readonly concept: string
    /** `test`, `e2e` or `probe`; the AI read is never posted by CI. */
    readonly slot: EvidenceSlot
    /** The test name, e2e file or probe id. */
    readonly ref: string
    /** Whether it passed. */
    readonly passed: boolean
}

/** The signed result document a StarCi GitHub Action posts. */
export interface CiRun {
    /** The CI run id; a repeat of the same id counts once. */
    readonly runId: string
    /** The commit the run tested. */
    readonly commit: string
    /** Whether the whole run passed. */
    readonly passed: boolean
    /** The results. */
    readonly results: ReadonlyArray<CiResult>
}

/** The signature of a delivery: HMAC-SHA256 over `<timestamp>.<raw body>` with the project's secret, as `sha256=<hex>`. */
export const ciSignatureOf = (secret: string, timestamp: string, rawBody: Buffer): string =>
    CI_SIGNATURE_PREFIX + createHmac("sha256", secret).update(timestamp).update(".").update(rawBody).digest("hex")

/** Whether the given signature is the project's, compared in constant time. */
export const isCiSignatureValid = (secret: string, timestamp: string, rawBody: Buffer, given: string): boolean => {
    const wanted = Buffer.from(ciSignatureOf(secret, timestamp, rawBody), "utf8")
    const actual = Buffer.from(given, "utf8")
    return actual.length === wanted.length && timingSafeEqual(actual, wanted)
}

/** Whether a delivery's timestamp (epoch milliseconds, as text) is within the window of now. */
export const isCiFresh = (timestamp: string, now: Date, toleranceMs: number): boolean => {
    const signedAt = Number(timestamp)
    return Number.isFinite(signedAt) && Math.abs(now.getTime() - signedAt) <= toleranceMs
}

const invalid = (cause?: unknown): ProjectError => new ProjectError({ code: ProjectErrorCode.CiPayloadInvalid, cause })

const hasControl = (text: string): boolean =>
    [...text].some((character) => Number(character.codePointAt(0)) < 32 || Number(character.codePointAt(0)) === 127)

const refOf = (value: unknown): string | null =>
    typeof value === "string" && value.trim() !== "" && value.length <= REF_MAX && !hasControl(value) ? value : null

const resultOf = (raw: unknown): CiResult => {
    if (!isRecord(raw)) throw invalid()
    const concept: unknown = raw["concept"]
    const slot = EVIDENCE_SLOTS.find((candidate) => candidate === raw["slot"])
    const ref = refOf(raw["ref"])
    if (
        typeof concept !== "string" ||
        !CONCEPT_ID.test(concept) ||
        slot === undefined ||
        slot === "code-read" ||
        ref === null
    ) {
        throw invalid()
    }
    if (typeof raw["passed"] !== "boolean") throw invalid()
    return { concept, slot, ref, passed: raw["passed"] }
}

/** Reads the raw body of a delivery into the signed result document; anything else is PROJECT_CI_PAYLOAD_INVALID. */
export const ciRunOf = (rawBody: Buffer | undefined): CiRun => {
    let body: unknown
    try {
        body = JSON.parse(rawBody?.toString("utf8") ?? "")
    } catch (cause) {
        throw invalid(cause)
    }
    if (!isRecord(body)) throw invalid()
    const runId: unknown = body["runId"]
    const commit: unknown = body["commit"]
    const results: unknown = body["results"]
    if (
        typeof runId !== "string" ||
        !RUN_ID.test(runId) ||
        typeof commit !== "string" ||
        !COMMIT.test(commit) ||
        typeof body["passed"] !== "boolean" ||
        !Array.isArray(results) ||
        results.length > CI_RESULTS_MAX
    ) {
        throw invalid()
    }
    return {
        runId,
        commit: commit.toLowerCase(),
        passed: body["passed"],
        results: results.map((result) => resultOf(result)),
    }
}
