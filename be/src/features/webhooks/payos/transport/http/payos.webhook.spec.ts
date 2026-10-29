import { mock } from "@starci/jest-preset"
import type { RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { PurchaseService } from "@modules/domain/purchase"
import { PayosWebhook } from "./payos.webhook"

const REQUEST = mock<RawBodyRequest<Request>>({ rawBody: Buffer.from("{}") })

describe("PayosWebhook", () => {
    describe("receive", () => {
        it("hands the raw body to the one domain intake", async () => {
            const deliveries = mock<PurchaseService>()
            const door = new PayosWebhook(deliveries)

            await door.receive(REQUEST)

            expect(deliveries.recordPayosDelivery).toHaveBeenCalledTimes(1)
            expect(deliveries.recordPayosDelivery).toHaveBeenCalledWith({ rawBody: REQUEST.rawBody })
        })

        it("propagates the intake's refusal without an acknowledgement of its own", async () => {
            const deliveries = mock<PurchaseService>()
            deliveries.recordPayosDelivery.mockRejectedValue(new Error("refused"))
            const door = new PayosWebhook(deliveries)

            await expect(door.receive(REQUEST)).rejects.toThrow("refused")
        })
    })
})
