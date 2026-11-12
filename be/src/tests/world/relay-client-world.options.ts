import { Injectable, Module } from "@nestjs/common"
import type { ModuleFactory } from "@starci/test-world"
import { InjectRelayClient, RelayClientModule, type RelayClientPort } from "@modules/integrations/relay-client"
import { HttpModule } from "@modules/platform/http"
import { IdsModule } from "@modules/platform/ids"

/**
 * The modules of the relay client world: the bounded outbound HTTP port and the ids the client needs, then the learner CLI's client
 * pointed at the real core app of the world, with a config folder owned by the run.
 */
export const relayClientModules: ReadonlyArray<ModuleFactory> = [
    () => IdsModule.register({ isGlobal: true }),
    () => HttpModule.register({ isGlobal: true }),
    (w) =>
        RelayClientModule.register({
            isGlobal: true,
            env: { STARCI_NEXT_HOME: w.directory("relay-client-home"), STARCI_NEXT_URL: w.apps.core?.url },
        }),
    () => ({ module: RelayClientHolderModule }),
]

@Injectable()
/** Hands a spec the client the way a consumer receives it: by its injection decorator. */
export class RelayClientHolder {
    constructor(@InjectRelayClient() readonly client: RelayClientPort) {}
}

@Module({ providers: [RelayClientHolder], exports: [RelayClientHolder] })
class RelayClientHolderModule {}
