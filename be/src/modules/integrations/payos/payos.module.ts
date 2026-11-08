import { Module, type DynamicModule } from "@nestjs/common"
import { PAYOS_CLIENT } from "./payos.decorators"
import { PayosClient } from "./payos.client"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./payos.module-definition"

@Module({})
/** The payOS payment rail: verifies payOS's own payment confirmations and grants nothing itself. */
export class PayosModule extends ConfigurableModuleClass {
    /** Registers the payOS client over the declared channel; a `null` channel still composes the rail so it refuses every call. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), PayosClient, { provide: PAYOS_CLIENT, useExisting: PayosClient }],
            exports: [PAYOS_CLIENT],
        }
    }
}
