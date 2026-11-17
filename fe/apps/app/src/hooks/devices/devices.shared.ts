import { ApiFailure } from "@/modules/failure"

/** Why a pairing step did not go through, as the screen words it; each comes from a stable error code, never a status. */
export type PairingIssue = "none" | "codeNotFound" | "deviceLimit" | "other"

/** The stable relay codes a pairing step answers, by the issue each one is. */
const ISSUE_OF_CODE: Readonly<Record<string, PairingIssue>> = {
    RELAY_CODE_NOT_FOUND: "codeNotFound",
    RELAY_DEVICE_LIMIT: "deviceLimit",
}

/** The issue a failed pairing step is. */
export const pairingIssueOf = (error: unknown): PairingIssue =>
    error instanceof ApiFailure && error.code !== undefined ? (ISSUE_OF_CODE[error.code] ?? "other") : "other"

/** The length of a pairing code without its dash. */
const CODE_LENGTH = 8

/** The code the learner typed in its stored form once it is complete (`XXXX-XXXX`), or undefined while it is not. */
export const completeCodeOf = (typed: string): string | undefined => {
    const compact = typed.toUpperCase().replaceAll(/[^A-Z0-9]/g, "")
    return compact.length === CODE_LENGTH ? `${compact.slice(0, 4)}-${compact.slice(4)}` : undefined
}
