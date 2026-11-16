import type { ErrorKind } from "@modules/platform/errors"

/** The code of `@starci/object-storage` the app itself acts on; the package's other codes travel as the package names them. */
export enum ObjectStorageErrorCode {
    /** The store could not be reached, timed out or refused the call. */
    Unavailable = "OBJECT_STORAGE_UNAVAILABLE",
}

/** Transport kinds of the object storage codes the app acts on. */
export const OBJECT_STORAGE_ERROR_KINDS: Record<ObjectStorageErrorCode, ErrorKind> = {
    [ObjectStorageErrorCode.Unavailable]: "unavailable",
}
