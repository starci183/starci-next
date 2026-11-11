import type { DevicePrincipal } from "@modules/domain/relay"

/** What reading a manifest takes: the device the credential proved and the task. */
export interface GetRelayManifestRequest {
    /** The device and its learner, from the device token. */
    readonly device: DevicePrincipal
    /** The task (a project id). */
    readonly taskId: string
    /** The milestone of a project run, or undefined for a plain task. */
    readonly milestone?: string | undefined
    /** The test command of the project's `starci/project.yaml`, or undefined. */
    readonly testCommand?: string | undefined
    /** The JUnit report path of the project's `starci/project.yaml`, or undefined. */
    readonly testReport?: string | undefined
}
