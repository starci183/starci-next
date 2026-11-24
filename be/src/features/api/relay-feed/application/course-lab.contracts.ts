import type { CourseLabSubmission, DevicePrincipal } from "@modules/domain/relay"

/** The lab of one lesson of a course: what every lab door names. */
export interface CourseLabRequest {
    /** The course id, a lowercase slug. */
    readonly courseId: string
    /** The lesson id, a lowercase slug. */
    readonly lessonId: string
}

/** Starting a lab: the lab and, optionally, the folder on the learner's machine to put it in. */
export interface StartCourseLabRequest extends CourseLabRequest {
    /** The folder the learner chose (a plain path text, 260 characters at most, no control character); absent keeps `~/starci/<course>/<lesson>`. */
    readonly dir?: string
}

/** The chaos switches to turn on for a lab. */
export interface SetCourseLabChaosRequest extends CourseLabRequest {
    /** The switch ids that are on afterwards; every other switch is off. */
    readonly chaosIds: ReadonlyArray<string>
}

/** A lab submission: the lab and what the learner supplies. */
export interface SubmitCourseLabRequest extends CourseLabRequest, CourseLabSubmission {}

/** The pairing code a CLI claims: the six digits and the device it reports. */
export interface ClaimRelayPairCodeRequest {
    /** The six-digit code. */
    readonly code: string
    /** The device name, 1 to 60 characters. */
    readonly deviceName: string
    /** The device platform. */
    readonly platform: string
}

/** The signing key a device registers. */
export interface RegisterRelayDeviceKeyRequest {
    /** The device and its learner, from the device token. */
    readonly device: DevicePrincipal
    /** The base64 SPKI Ed25519 public key. */
    readonly publicKey: string
}

/** What registering a key answers: that the device holds it. */
export interface RelayDeviceKeyRegistered {
    /** Always true once the key is held (the same key again answers true too). */
    readonly registered: boolean
}

/** What issuing a pairing code takes: nothing but the signed-in learner. */
export type IssueRelayPairCodeRequest = Record<string, never>
