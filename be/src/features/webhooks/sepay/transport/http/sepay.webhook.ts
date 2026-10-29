import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from "@nestjs/common"
import type { RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { PurchaseService } from "@modules/domain/purchase"
import { RateLimit, RateTier } from "@modules/platform/http-security"

@Controller("webhooks/sepay")
/**
 * POST /webhooks/sepay, the signed intake door of the SePay IPN notifier. `recordSepayDelivery` is this
 * provider's declared domain verifier (sepay-http.module's `webhookVerifiers`): it authenticates the
 * `x-secret-key` header and proves the IPN through the SePay client before any field is trusted, then
 * records the confirmation once. A refusal is its thrown error; the door answers 204 and no body.
 */
export class SepayWebhook {
    constructor(private readonly deliveries: PurchaseService) {}

    /** Acknowledges with 204 and no body: a duplicate delivery is answered without another settlement. */
    @Post()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Public({ reason: PublicReason.SignedWebhook })
    @RateLimit(RateTier.Strict)
    async receive(
        @Req() request: RawBodyRequest<Request>,
        @Headers("x-secret-key") secretKey: string | undefined,
    ): Promise<void> {
        await this.deliveries.recordSepayDelivery({ rawBody: request.rawBody, secretKey })
    }
}
