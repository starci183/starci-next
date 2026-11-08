import { Controller, HttpCode, HttpStatus, Post, Req, type RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { PurchaseService } from "@modules/domain/purchase"
import { RateBucket, RateLimit, RateTier } from "@modules/platform/http-security"

/** The acknowledgement the provider reads with the 200 status: `{"success": true}`, as its webhook documentation shows. */
export const PROVIDER_ACK = { success: true } as const

@Controller("webhooks/payos")
/**
 * POST /webhooks/payos, the signed intake door of the payOS notifier. `recordPayosDelivery` is this
 * provider's declared domain verifier (payos-http.module's `webhookVerifiers`): it proves the webhook
 * signature through the payOS client before any field is trusted, then records the confirmation once.
 * An unproved or unreadable delivery is its thrown error (401, 400); every signed delivery, applied, duplicate or
 * recorded as refused (payOS's confirm-webhook test delivery included), is answered 200 `{"success": true}`.
 */
export class PayosWebhook {
    constructor(private readonly deliveries: PurchaseService) {}

    /** Acknowledges with 200 and `{"success": true}`: a duplicate delivery is answered without another settlement. */
    @Post()
    @HttpCode(HttpStatus.OK)
    @Public({ reason: PublicReason.SignedWebhook })
    @RateLimit(RateTier.Strict, RateBucket.Webhook)
    async receive(@Req() request: RawBodyRequest<Request>): Promise<typeof PROVIDER_ACK> {
        await this.deliveries.recordPayosDelivery({ rawBody: request.rawBody })
        return PROVIDER_ACK
    }
}
