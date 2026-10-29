import { Module } from "@nestjs/common"
import type { DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./purchase.module-definition"
import { PurchaseService } from "./purchase.service"

@Module({})
/** The Premium purchase capability: server-owned offers, rail checkout and verified, idempotent settlement. */
export class PurchaseModule extends ConfigurableModuleClass {
    /** Registers the purchase service. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), PurchaseService],
            exports: [PurchaseService],
        }
    }
}
