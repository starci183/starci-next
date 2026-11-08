import type { DevicePrincipal } from "@modules/domain/relay"

/** What reading a manifest takes: the device the credential proved and the task. */
export interface GetRelayManifestRequest {
    /** The device and its learner, from the device token. */
    readonly device: DevicePrincipal
    /** The task (a project id). */
    readonly taskId: string
}
