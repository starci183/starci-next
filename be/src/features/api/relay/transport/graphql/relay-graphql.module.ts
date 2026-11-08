import { Module } from "@nestjs/common"
import { RelayApiModule } from "../../relay.module"
import { GetRelayPairingResolver } from "./get-relay-pairing.resolver"
import { ConfirmRelayDeviceResolver } from "./confirm-relay-device.resolver"
import { RevokeRelayDeviceResolver } from "./revoke-relay-device.resolver"
import { ListRelayDevicesResolver } from "./list-relay-devices.resolver"
import { ConfigurableModuleClass } from "./relay-graphql.module-definition"

@Module({
    imports: [RelayApiModule.register({})],
    providers: [
        GetRelayPairingResolver,
        ConfirmRelayDeviceResolver,
        RevokeRelayDeviceResolver,
        ListRelayDevicesResolver,
    ],
})
/** The GraphQL transport of the relay feature: the learner's pairing preview, confirm, device list and revoke. */
export class RelayGraphqlModule extends ConfigurableModuleClass {}
