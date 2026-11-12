import { verify } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type {
    ManifestCheck,
    ManifestPlan,
    ManifestRead,
    SignatureRead,
    VerifiedManifest,
} from "./relay-client.contracts"
import { isRecord, jsonOf } from "./json.mapper"

/** One check of a payload, or null when it is not one (a cwd above the task workspace is not one). */
const checkOf = (value: unknown): ManifestCheck | null => {
    if (!isRecord(value)) return null
    const { id, command, cwd, timeoutMs } = value
    if (typeof id !== "string" || typeof command !== "string" || typeof cwd !== "string") return null
    if (typeof timeoutMs !== "number" || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) return null
    if (cwd.startsWith("/") || cwd.includes("..") || cwd.includes(":")) return null
    return { id, command, cwd, timeoutMs }
}

/** The plan of a payload: absent (undefined) for a plain task, null when it is there but malformed. */
const planOf = (value: unknown): ManifestPlan | null | undefined => {
    if (value === undefined) return undefined
    if (!isRecord(value) || typeof value.milestone !== "string" || typeof value.report !== "string") return null
    const { concepts } = value
    if (!Array.isArray(concepts) || !concepts.every((concept) => typeof concept === "string")) return null
    return { milestone: value.milestone, report: value.report, concepts: concepts.map(String) }
}

/** The manifest of a parsed payload, or null when any part of it is malformed. */
const manifestOf = (value: unknown): VerifiedManifest | null => {
    if (!isRecord(value) || typeof value.manifestId !== "string" || typeof value.taskId !== "string") return null
    if (!Array.isArray(value.checks)) return null
    const checks = value.checks.map((check) => checkOf(check))
    if (checks.includes(null)) return null
    const plan = planOf(value.plan)
    if (plan === null) return null
    return {
        manifestId: value.manifestId,
        taskId: value.taskId,
        checks: checks.filter((check) => check !== null),
        ...(plan === undefined ? {} : { plan }),
    }
}

/** Whether the Ed25519 signature holds over the payload; a key or signature that cannot be read is rejected with its cause. */
const signatureOf = (payload: string, signature: string, publicKeyPem: string): SignatureRead => {
    try {
        return {
            kind: "checked",
            holds: verify(null, Buffer.from(payload, "utf8"), publicKeyPem, Buffer.from(signature, "base64")),
        }
    } catch (error) {
        return { kind: "rejected", cause: error }
    }
}

@Injectable()
/**
 * Verifies a manifest's Ed25519 signature over its exact payload with the StarCi public key, then reads the checks from the
 * signed payload alone. A bad signature, an unreadable payload or any malformed check rejects the whole manifest: the CLI
 * never runs an unsigned or unknown command.
 */
export class ManifestPolicy {
    /** The verified manifest of a signed payload, or why it was rejected. */
    verified(payload: string, signature: string, publicKeyPem: string): ManifestRead {
        const signed = signatureOf(payload, signature, publicKeyPem)
        if (signed.kind === "rejected") return signed
        if (!signed.holds) return { kind: "rejected", cause: "signature" }
        const read = jsonOf(payload)
        if (read.kind === "unreadable") return { kind: "rejected", cause: read.cause }
        const manifest = manifestOf(read.value)
        return manifest === null ? { kind: "rejected", cause: "payload" } : { kind: "verified", manifest }
    }
}
