import { Module } from "@nestjs/common"
import { PurchaseService } from "@modules/domain/purchase"
import { ConfigurableModuleClass } from "./payos-http.module-definition"
import { PayosWebhook } from "./payos.webhook"

/** The domain methods that prove a payOS delivery before it is trusted: the intake verifies internally. */
export const webhookVerifiers: ReadonlyArray<PurchaseService["recordPayosDelivery"]> = [
    PurchaseService.prototype.recordPayosDelivery,
] as const

@Module({ controllers: [PayosWebhook] })
/** The HTTP transport of the payOS notifier: its webhook door; the intake service comes from the purchase capability. */
export class PayosHttpModule extends ConfigurableModuleClass {}
