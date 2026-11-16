import type { ErrorKind } from "@modules/platform/errors"

/** The codes an object store call rejects with: the wire codes of `@starci/object-storage`, named by the boundary. */
export enum ObjectStorageErrorCode {
    /** The bucket has no object at the requested key. */
    ObjectNotFound = "OBJECT_STORAGE_NOT_FOUND",
    /** The store could not be reached, timed out or refused the call. */
    Unavailable = "OBJECT_STORAGE_UNAVAILABLE",
    /** The object key is not one the store accepts. */
    KeyInvalid = "OBJECT_STORAGE_KEY_INVALID",
    /** The bucket name is not one the store accepts. */
    BucketInvalid = "OBJECT_STORAGE_BUCKET_INVALID",
    /** The requested lifetime of a presigned request is outside the allowed range. */
    ExpiryInvalid = "OBJECT_STORAGE_EXPIRY_INVALID",
    /** The object is larger than the size limit in force. */
    SizeExceeded = "OBJECT_STORAGE_SIZE_EXCEEDED",
    /** A size limit is in force and the upload request names no size to sign. */
    SizeRequired = "OBJECT_STORAGE_SIZE_REQUIRED",
    /** The content type is not one the limits in force admit. */
    ContentTypeNotAllowed = "OBJECT_STORAGE_CONTENT_TYPE_NOT_ALLOWED",
    /** A page size of a listing is not a whole number from 1 to 1000. */
    LimitInvalid = "OBJECT_STORAGE_LIMIT_INVALID",
}

/** Transport kinds of the object storage codes: a missing object is not-found, an unreachable store unavailable, everything else invalid. */
export const OBJECT_STORAGE_ERROR_KINDS: Record<ObjectStorageErrorCode, ErrorKind> = {
    [ObjectStorageErrorCode.ObjectNotFound]: "not-found",
    [ObjectStorageErrorCode.Unavailable]: "unavailable",
    [ObjectStorageErrorCode.KeyInvalid]: "invalid",
    [ObjectStorageErrorCode.BucketInvalid]: "invalid",
    [ObjectStorageErrorCode.ExpiryInvalid]: "invalid",
    [ObjectStorageErrorCode.SizeExceeded]: "invalid",
    [ObjectStorageErrorCode.SizeRequired]: "invalid",
    [ObjectStorageErrorCode.ContentTypeNotAllowed]: "invalid",
    [ObjectStorageErrorCode.LimitInvalid]: "invalid",
}
