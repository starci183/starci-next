import type { DevicePrincipal, RelayUpload } from "@modules/domain/relay"

/** What one upload takes: the device the credential proved and the event it sends. */
export interface UploadRelayEventRequest {
    /** The device and its learner, from the device token. */
    readonly device: DevicePrincipal
    /** The event, with its client event id. */
    readonly upload: RelayUpload
}
