import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the realtime capability. */
export enum RealtimeErrorCode {
    /** The environment names a hub this app does not run; only the memory hub of a single replica is built. */
    HubUnsupported = "REALTIME_HUB_UNSUPPORTED",
}

/** How each realtime code travels. */
export const REALTIME_ERROR_KINDS: Record<RealtimeErrorCode, ErrorKind> = {
    [RealtimeErrorCode.HubUnsupported]: "internal",
}

/** The one error class of the realtime capability. */
export class RealtimeError extends DomainError<RealtimeErrorCode> {}
