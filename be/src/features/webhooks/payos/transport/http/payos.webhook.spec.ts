import { mock } from "@starci/jest-preset"
import type { RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { PurchaseService } from "@modules/domain/purchase"
import { RateBucket, RateTier } from "@modules/platform/http-security"
import { PayosWebhook } from "./payos.webhook"

const REQUEST = mock<RawBodyRequest<Request>>({ rawBody: Buffer.from("{}") })

describe("PayosWebhook", () => {
    describe("receive", () => {
        it("hands the raw body to the one domain intake", async () => {
            const deliveries = mock<PurchaseService>()
            const door = new PayosWebhook(deliveries)

            await expect(door.receive(REQUEST)).resolves.toEqual({ success: true })

            expect(deliveries.recordPayosDelivery).toHaveBeenCalledTimes(1)
            expect(deliveries.recordPayosDelivery).toHaveBeenCalledWith({ rawBody: REQUEST.rawBody })
        })

        it("answers 200 in the webhook window of the strict tier, apart from sign-in", () => {
            expect(Reflect.getMetadata("__httpCode__", PayosWebhook.prototype.receive)).toBe(200)
            expect(Reflect.getMetadata("platform.http-security.rate-tier", PayosWebhook.prototype.receive)).toBe(
                RateTier.Strict,
            )
            expect(Reflect.getMetadata("platform.http-security.rate-bucket", PayosWebhook.prototype.receive)).toBe(
                RateBucket.Webhook,
            )
        })

        it("propagates the intake's refusal without an acknowledgement of its own", async () => {
            const deliveries = mock<PurchaseService>()
            deliveries.recordPayosDelivery.mockRejectedValue(new Error("refused"))
            const door = new PayosWebhook(deliveries)

            await expect(door.receive(REQUEST)).rejects.toThrow("refused")
        })
    })
})
