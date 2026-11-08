import { Injectable } from "@nestjs/common"
import type { CredentialAuthenticator, CredentialMetadata, CredentialPrincipal } from "@modules/domain/identity"
import { RelayError, RelayErrorCode } from "./errors/relay.error"
import { RelayDeviceService } from "./relay-device.service"

/** The credential family of a paired device's bearer token. */
const DEVICE_CREDENTIAL = "tool-token"

@Injectable()
/**
 * The identity credential port of the relay app: a door marked `@Credential({ kind: "tool-token" })` admits a paired
 * device's `Authorization: Bearer <device token>`, as the device (subject) of its learner (workspace).
 */
export class RelayCredentialAdapter implements CredentialAuthenticator {
    constructor(private readonly devices: RelayDeviceService) {}

    /** Proves the bearer device token; any other credential family or a missing bearer is RELAY_DEVICE_REVOKED. */
    async authenticate(metadata: CredentialMetadata, authorization: string): Promise<CredentialPrincipal> {
        const token = /^Bearer ([A-Za-z0-9_-]+)$/u.exec(authorization)?.[1]
        if (metadata.kind !== DEVICE_CREDENTIAL || token === undefined)
            throw new RelayError({ code: RelayErrorCode.DeviceRevoked })
        const device = await this.devices.authenticate(token)
        return { kind: DEVICE_CREDENTIAL, subject: device.deviceId, workspaceId: device.learnerId }
    }
}
