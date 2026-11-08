import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./purchase.module-definition"
import { PremiumReadService } from "./premium-read.service"
import { PurchaseService } from "./purchase.service"
import { PurchaseSettlementService } from "./purchase-settlement.service"

@Module({})
/** The Premium purchase capability: server-owned offers, rail checkout and verified, idempotent settlement. */
export class PurchaseModule extends ConfigurableModuleClass {
    /** Registers the purchase service. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [...(base.providers ?? []), PurchaseService, PurchaseSettlementService, PremiumReadService],
            exports: [PurchaseService, PremiumReadService],
        }
    }
}
