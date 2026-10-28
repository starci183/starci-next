import { DomainError } from "@modules/platform/errors"
import type { ErrorKind } from "@modules/platform/errors"

/** Codes of the entitlement capability. */
export enum EntitlementErrorCode {
    /** The entitlement grant did not return its stored row. */
    EntitlementMissing = "ENTITLEMENT_MISSING",
}

/** How each entitlement code travels. */
export const ENTITLEMENT_ERROR_KINDS: Record<EntitlementErrorCode, ErrorKind> = {
    [EntitlementErrorCode.EntitlementMissing]: "internal",
}

/** The one error class of the entitlement capability. */
export class EntitlementError extends DomainError<EntitlementErrorCode> {}
