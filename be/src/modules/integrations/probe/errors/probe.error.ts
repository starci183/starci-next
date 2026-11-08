import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the probe transport. */
export enum ProbeErrorCode {
    /** The name of a probe target resolves to an address that is not on the public internet. */
    TargetRefused = "PROBE_TARGET_REFUSED",
}

/** How each probe code travels. */
export const PROBE_ERROR_KINDS: Record<ProbeErrorCode, ErrorKind> = {
    [ProbeErrorCode.TargetRefused]: "invalid",
}

/** The one error class of the probe transport. */
export class ProbeError extends DomainError<ProbeErrorCode> {}
