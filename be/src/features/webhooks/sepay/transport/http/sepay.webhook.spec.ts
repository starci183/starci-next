import { mock } from "@starci/jest-preset"
import type { RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { PurchaseService } from "@modules/domain/purchase"
import { RateBucket, RateTier } from "@modules/platform/http-security"
import { SepayWebhook } from "./sepay.webhook"

const REQUEST = mock<RawBodyRequest<Request>>({ rawBody: Buffer.from("{}") })

describe("SepayWebhook", () => {
    describe("receive", () => {
        it("hands the raw body and the secret header to the one domain intake", async () => {
            const deliveries = mock<PurchaseService>()
            const door = new SepayWebhook(deliveries)

            await expect(door.receive(REQUEST, "secret-1")).resolves.toEqual({ success: true })

            expect(deliveries.recordSepayDelivery).toHaveBeenCalledTimes(1)
            expect(deliveries.recordSepayDelivery).toHaveBeenCalledWith({
                rawBody: REQUEST.rawBody,
                secretKey: "secret-1",
            })
        })

        it("answers 200 as SePay's IPN specification requires, in the webhook window of the strict tier", () => {
            expect(Reflect.getMetadata("__httpCode__", SepayWebhook.prototype.receive)).toBe(200)
            expect(Reflect.getMetadata("platform.http-security.rate-tier", SepayWebhook.prototype.receive)).toBe(
                RateTier.Strict,
            )
            expect(Reflect.getMetadata("platform.http-security.rate-bucket", SepayWebhook.prototype.receive)).toBe(
                RateBucket.Webhook,
            )
        })

        it("propagates the intake's refusal without an acknowledgement of its own", async () => {
            const deliveries = mock<PurchaseService>()
            deliveries.recordSepayDelivery.mockRejectedValue(new Error("refused"))
            const door = new SepayWebhook(deliveries)

            await expect(door.receive(REQUEST, undefined)).rejects.toThrow("refused")
        })
    })
})
