import { Module } from "@nestjs/common"
import { RelayApiModule } from "../../relay.module"
import { ConfigurableModuleClass } from "./relay-http.module-definition"
import { RelayDeviceStartController } from "./relay-device-start.controller"
import { RelayDeviceTokenController } from "./relay-device-token.controller"

@Module({
    imports: [RelayApiModule.register({})],
    controllers: [RelayDeviceStartController, RelayDeviceTokenController],
})
/** Serves the two unauthenticated doors of the CLI pairing handshake: start and token. */
export class RelayHttpModule extends ConfigurableModuleClass {}
