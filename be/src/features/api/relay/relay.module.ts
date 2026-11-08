import { Module } from "@nestjs/common"
import { StartRelayPairingHandler } from "./application/start-relay-pairing.handler"
import { TakeRelayTokenHandler } from "./application/take-relay-token.handler"
import { GetRelayPairingHandler } from "./application/get-relay-pairing.handler"
import { ConfirmRelayDeviceHandler } from "./application/confirm-relay-device.handler"
import { ListRelayDevicesHandler } from "./application/list-relay-devices.handler"
import { RevokeRelayDeviceHandler } from "./application/revoke-relay-device.handler"
import { ConfigurableModuleClass } from "./relay.module-definition"

@Module({
    providers: [
        StartRelayPairingHandler,
        TakeRelayTokenHandler,
        GetRelayPairingHandler,
        ConfirmRelayDeviceHandler,
        ListRelayDevicesHandler,
        RevokeRelayDeviceHandler,
    ],
})
/** Application handlers of the relay feature: the CLI pairing handshake and the learner's own device doors. */
export class RelayApiModule extends ConfigurableModuleClass {}
