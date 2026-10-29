import { Module } from "@nestjs/common"
import { PurchaseService } from "@modules/domain/purchase"
import { ConfigurableModuleClass } from "./sepay-http.module-definition"
import { SepayWebhook } from "./sepay.webhook"

/** The domain methods that prove a SePay delivery before it is trusted: the intake verifies internally. */
export const webhookVerifiers = [PurchaseService.prototype.recordSepayDelivery] as const

@Module({ controllers: [SepayWebhook] })
/** The HTTP transport of the SePay IPN notifier: its webhook door; the intake service comes from the purchase capability. */
export class SepayHttpModule extends ConfigurableModuleClass {}
