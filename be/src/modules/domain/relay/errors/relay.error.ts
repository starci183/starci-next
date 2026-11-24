import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the relay capability. */
export enum RelayErrorCode {
    /** The pairing code is unknown, expired or already used. */
    CodeNotFound = "RELAY_CODE_NOT_FOUND",
    /** The learner already has as many paired devices as their plan allows. */
    DeviceLimit = "RELAY_DEVICE_LIMIT",
    /** The learner has not confirmed the pairing code yet. */
    Pending = "RELAY_PENDING",
    /** The device token is unknown or its device was revoked. */
    DeviceRevoked = "RELAY_DEVICE_REVOKED",
    /** The device does not exist or belongs to another learner; the two are indistinguishable. */
    DeviceNotFound = "RELAY_DEVICE_NOT_FOUND",
    /** The device name or platform of a pairing request is outside its bounds. */
    PairingInvalid = "RELAY_PAIRING_INVALID",
    /** An upload or a manifest request is not well formed for its kind or is over its size. */
    PayloadInvalid = "RELAY_PAYLOAD_INVALID",
    /** The relay could not read or write its device state. */
    Unavailable = "RELAY_UNAVAILABLE",
    /** The lesson is not published, has no source commit or scenarios, or names no such scenario or challenge. */
    LessonNotRunnable = "RELAY_LESSON_NOT_RUNNABLE",
    /** The challenge tier is not unlocked yet: the hidden scenarios of the tier below are not all green. */
    ChallengeLocked = "RELAY_CHALLENGE_LOCKED",
    /** A project run, manifest or upload from a learner without Premium: Projects are subscription-only. */
    ProjectPremiumRequired = "RELAY_PROJECT_PREMIUM_REQUIRED",
    /** A run was asked for from the app and none of the learner's paired devices is online to take it. */
    DeviceOffline = "RELAY_DEVICE_OFFLINE",
    /** The lesson has no lab: no course holds a lab contract for it. */
    LabNotFound = "RELAY_LAB_NOT_FOUND",
    /** The lab is a part beyond the free one of Essentials, which needs Premium. */
    LabPremiumRequired = "RELAY_LAB_PREMIUM_REQUIRED",
    /** A grading was asked for and the online device has not registered its signing key. */
    DeviceKeyMissing = "RELAY_DEVICE_KEY_MISSING",
    /** The device already registered a signing key; a new key needs a new pairing. */
    DeviceKeyLocked = "RELAY_DEVICE_KEY_LOCKED",
    /** The signing key is not a base64 SPKI Ed25519 public key. */
    DeviceKeyInvalid = "RELAY_DEVICE_KEY_INVALID",
    /** The six-digit pairing code is unknown, expired or already used; the three are indistinguishable. */
    PairCodeNotFound = "RELAY_PAIR_CODE_NOT_FOUND",
    /** The learner already has a submission of this lab that is still being graded. */
    LabSubmissionRunning = "RELAY_LAB_SUBMISSION_RUNNING",
    /** A grading result named a submission that is unknown or belongs to another learner. */
    GradeRejected = "RELAY_GRADE_REJECTED",
    /** The solution of a lab was asked for before a submission of the learner passed. */
    LabSolutionLocked = "RELAY_LAB_SOLUTION_LOCKED",
}

/** How each relay code travels. */
export const RELAY_ERROR_KINDS: Record<RelayErrorCode, ErrorKind> = {
    [RelayErrorCode.CodeNotFound]: "not-found",
    [RelayErrorCode.DeviceLimit]: "forbidden",
    [RelayErrorCode.Pending]: "conflict",
    [RelayErrorCode.DeviceRevoked]: "unauthenticated",
    [RelayErrorCode.DeviceNotFound]: "not-found",
    [RelayErrorCode.PairingInvalid]: "invalid",
    [RelayErrorCode.PayloadInvalid]: "invalid",
    [RelayErrorCode.Unavailable]: "unavailable",
    [RelayErrorCode.LessonNotRunnable]: "not-found",
    [RelayErrorCode.ChallengeLocked]: "forbidden",
    [RelayErrorCode.ProjectPremiumRequired]: "forbidden",
    [RelayErrorCode.DeviceOffline]: "unavailable",
    [RelayErrorCode.LabNotFound]: "not-found",
    [RelayErrorCode.LabPremiumRequired]: "forbidden",
    [RelayErrorCode.DeviceKeyMissing]: "conflict",
    [RelayErrorCode.DeviceKeyLocked]: "conflict",
    [RelayErrorCode.DeviceKeyInvalid]: "invalid",
    [RelayErrorCode.PairCodeNotFound]: "not-found",
    [RelayErrorCode.LabSubmissionRunning]: "conflict",
    [RelayErrorCode.GradeRejected]: "forbidden",
    [RelayErrorCode.LabSolutionLocked]: "forbidden",
}

/** The one error class of the relay capability. */
export class RelayError extends DomainError<RelayErrorCode> {}
