import { Controller, Headers, HttpCode, HttpStatus, Post, Req, type RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { PurchaseService } from "@modules/domain/purchase"
import { RateBucket, RateLimit, RateTier } from "@modules/platform/http-security"

/** The acknowledgement the provider reads with the 200 status: `{"success": true}`, as its webhook documentation shows. */
export const PROVIDER_ACK = { success: true } as const

@Controller("webhooks/sepay")
/**
 * POST /webhooks/sepay, the signed intake door of the SePay IPN notifier. `recordSepayDelivery` is this
 * provider's declared domain verifier (sepay-http.module's `webhookVerifiers`): it authenticates the
 * `x-secret-key` header and proves the IPN through the SePay client before any field is trusted, then
 * records the confirmation once. An unauthenticated or unreadable delivery is its thrown error (401, 400); every
 * authenticated delivery, applied, duplicate or recorded as refused, is answered 200 `{"success": true}` as SePay's IPN
 * specification requires, so SePay never retries a delivery the domain has already recorded.
 */
export class SepayWebhook {
    constructor(private readonly deliveries: PurchaseService) {}

    /** Acknowledges with 200 and `{"success": true}`: a duplicate delivery is answered without another settlement. */
    @Post()
    @HttpCode(HttpStatus.OK)
    @Public({ reason: PublicReason.SignedWebhook })
    @RateLimit(RateTier.Strict, RateBucket.Webhook)
    async receive(
        @Req() request: RawBodyRequest<Request>,
        @Headers("x-secret-key") secretKey: string | undefined,
    ): Promise<typeof PROVIDER_ACK> {
        await this.deliveries.recordSepayDelivery({ rawBody: request.rawBody, secretKey })
        return PROVIDER_ACK
    }
}
