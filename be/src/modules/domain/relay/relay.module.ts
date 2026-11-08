import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./relay.module-definition"
import { RelayDeviceService } from "./relay-device.service"
import { RelayCredentialAdapter } from "./relay-credential.adapter"
import { RelayProjectService } from "./relay-project.service"

@Module({})
/**
 * The relay capability: device pairing, the device list and revoke, device-token authentication and the project practice
 * port. The device feed (manifests and uploads) is `RelayFeedModule`, which only the relay app composes with its hub.
 */
export class RelayModule extends ConfigurableModuleClass {
    /** Registers the device service. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), RelayDeviceService, RelayCredentialAdapter, RelayProjectService],
            exports: [RelayDeviceService, RelayCredentialAdapter, RelayProjectService],
        }
    }
}
