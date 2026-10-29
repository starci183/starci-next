import { Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common"
import type { RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { PurchaseService } from "@modules/domain/purchase"
import { RateLimit, RateTier } from "@modules/platform/http-security"

@Controller("webhooks/payos")
/**
 * POST /webhooks/payos, the signed intake door of the payOS notifier. `recordPayosDelivery` is this
 * provider's declared domain verifier (payos-http.module's `webhookVerifiers`): it proves the webhook
 * signature through the payOS client before any field is trusted, then records the confirmation once.
 * A refusal is its thrown error; the door answers 204 and no body.
 */
export class PayosWebhook {
    constructor(private readonly deliveries: PurchaseService) {}

    /** Acknowledges with 204 and no body: a duplicate delivery is answered without another settlement. */
    @Post()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Public({ reason: PublicReason.SignedWebhook })
    @RateLimit(RateTier.Strict)
    async receive(@Req() request: RawBodyRequest<Request>): Promise<void> {
        await this.deliveries.recordPayosDelivery({ rawBody: request.rawBody })
    }
}
