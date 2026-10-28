import { Module } from "@nestjs/common"
import type { DynamicModule } from "@nestjs/common"
import { SEPAY_CLIENT } from "./sepay.decorators"
import { SepayClient } from "./sepay.client"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./sepay.module-definition"

@Module({})
/** The SePay payment rail: verifies SePay's own payment confirmations and grants nothing itself. */
export class SepayModule extends ConfigurableModuleClass {
    /** Registers the SePay client over the declared channel; a `null` channel still composes the rail so it refuses every call. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), SepayClient, { provide: SEPAY_CLIENT, useExisting: SepayClient }],
            exports: [SEPAY_CLIENT],
        }
    }
}
