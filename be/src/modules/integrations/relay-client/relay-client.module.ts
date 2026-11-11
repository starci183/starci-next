import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { IDS, type Ids } from "@modules/platform/ids"
import { RELAY_CLIENT, RELAY_CORRELATION, RELAY_TERMINAL } from "./relay-client.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./relay-client.module-definition"
import { RelayClientService } from "./relay-client.service"
import { ManifestPolicy } from "./manifest.policy"
import { ProjectKitService } from "./project-kit.service"
import { TerminalClient } from "./terminal.client"

@Module({})
/** The learner CLI's side of the relay: consumers receive only the port, never the HTTP calls or the config file. */
export class RelayClientModule extends ConfigurableModuleClass {
    /** Registers the client over this machine's settings and terminal. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const client: Provider = { provide: RELAY_CLIENT, useExisting: RelayClientService }
        const terminal: Provider = { provide: RELAY_TERMINAL, useExisting: TerminalClient }
        const correlation: Provider = {
            provide: RELAY_CORRELATION,
            inject: [IDS],
            useFactory: (ids: Ids) => ids.next(),
        }
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                ManifestPolicy,
                ProjectKitService,
                TerminalClient,
                RelayClientService,
                client,
                terminal,
                correlation,
            ],
            exports: [RELAY_CLIENT],
        }
    }
}
