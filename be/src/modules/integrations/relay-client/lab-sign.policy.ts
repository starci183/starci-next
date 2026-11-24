import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto"
import type { LabTest } from "./lab.contracts"

/** The canonical JSON of a value: object keys sorted at every depth, no spaces, undefined members left out. */
export const canonicalJson = (value: unknown): string => {
    if (Array.isArray(value))
        return `[${(value as ReadonlyArray<unknown>).map((item) => canonicalJson(item ?? null)).join(",")}]`
    if (typeof value === "object" && value !== null) {
        const record = value as Readonly<Record<string, unknown>>
        const members = Object.keys(record)
            .filter((key) => record[key] !== undefined)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
        return `{${members.join(",")}}`
    }
    return JSON.stringify(value)
}

/**
 * Why a grading could not judge the commit: no report was readable, tracked changes were not committed, or another step failed
 * (checkout, install, a hidden file) or the lab folder is not on this machine. The server ends the submission with it as the reason.
 */
export type GradeFailure = "no-readable-report" | "uncommitted" | "run-failed" | "lab-not-found"

/** What a grade's signature covers. */
export interface GradeStatement {
    readonly submissionId: string
    readonly nonce: string
    readonly commit: string
    readonly tests: ReadonlyArray<Pick<LabTest, "id" | "passed" | "durationMs" | "message">>
    /** Present only on a statement that the run failed; signed with the rest, left out of the text when absent. */
    readonly failure?: GradeFailure
}

/**
 * The exact text the device signs for a grade: the canonical JSON of `{submissionId, nonce, commit, tests: [{id, passed, durationMs,
 * message}]}`, which is what the relay rebuilds from the upload and verifies. Only those four fields of a test are signed (the name
 * travels with the upload but is not covered), and `message` is `""` for a test that passed.
 */
export const gradeTextOf = (statement: GradeStatement): string =>
    canonicalJson({
        submissionId: statement.submissionId,
        nonce: statement.nonce,
        commit: statement.commit,
        tests: statement.tests.map((test) => ({
            id: test.id,
            passed: test.passed,
            durationMs: test.durationMs,
            message: test.message,
        })),
        failure: statement.failure,
    })

/** A fresh Ed25519 key pair: the private half as a PKCS8 PEM to keep, the public half as base64 SPKI DER to register. */
export const newDeviceKey = (): { readonly privatePem: string; readonly publicKey: string } => {
    const pair = generateKeyPairSync("ed25519")
    return {
        privatePem: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
        publicKey: pair.publicKey.export({ type: "spki", format: "der" }).toString("base64"),
    }
}

/** The Ed25519 signature (base64) of a text with a private key PEM. */
export const signText = (privatePem: string, text: string): string =>
    sign(null, Buffer.from(text, "utf8"), createPrivateKey(privatePem)).toString("base64")

/** The base64 SPKI DER public key of a private key PEM. */
export const publicKeyOf = (privatePem: string): string =>
    createPublicKey(createPrivateKey(privatePem)).export({ type: "spki", format: "der" }).toString("base64")

/** Whether a signature (base64) holds over a text with a base64 SPKI DER public key: what the server does, here so a spec proves the round trip. */
export const signatureHolds = (publicKey: string, text: string, signature: string): boolean =>
    verify(
        null,
        Buffer.from(text, "utf8"),
        createPublicKey({ key: Buffer.from(publicKey, "base64"), type: "spki", format: "der" }),
        Buffer.from(signature, "base64"),
    )
