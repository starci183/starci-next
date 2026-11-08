import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { ProbeHttpClient } from "./probe-http.client"
import { PROBE_TRANSPORT } from "./probe.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./probe.module-definition"

@Module({})
/** The probe transport: a guarded HTTP client for the server probes of a learner's deployed address. */
export class ProbeModule extends ConfigurableModuleClass {
    /** Registers the client and binds it to the transport port. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const transport: Provider = { provide: PROBE_TRANSPORT, useExisting: ProbeHttpClient }
        return {
            ...base,
            providers: [...(base.providers ?? []), ProbeHttpClient, transport],
            exports: [PROBE_TRANSPORT],
        }
    }
}
