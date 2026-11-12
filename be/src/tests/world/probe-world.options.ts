import { Injectable, Module } from "@nestjs/common"
import type { ModuleFactory } from "@starci/test-world"
import { HttpModule } from "@modules/platform/http"
import { InjectProbeTransport, ProbeModule, type ProbeTransport } from "@modules/integrations/probe"

@Injectable()
/** Hands a spec the transport the way a consumer receives it: by its injection decorator. */
export class ProbeTransportHolder {
    constructor(@InjectProbeTransport() readonly transport: ProbeTransport) {}
}

@Module({ providers: [ProbeTransportHolder], exports: [ProbeTransportHolder] })
class ProbeTransportHolderModule {}

/** The modules of the probe world: the real wire the transport opens connections through, then the transport itself. */
export const probeModules: ReadonlyArray<ModuleFactory> = [
    () => HttpModule.register({ isGlobal: true }),
    () => ProbeModule.register({ isGlobal: true }),
    () => ({ module: ProbeTransportHolderModule }),
]
