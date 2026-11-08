import { Test } from "@nestjs/testing"
import { orderStatusOf } from "./order-status.policy"
import type { OrderStatus, PurchaseStatus } from "./purchase.contracts"

const POLICY: unique symbol = Symbol("purchase.order-status-policy")
const policies = { orderStatusOf }

describe("order status policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it.each<[PurchaseStatus, OrderStatus]>([
        ["pending", "verifying"],
        ["paid", "active"],
        ["failed", "failed"],
        ["canceled", "failed"],
        ["expired", "expired"],
    ])("shows a %s purchase as %s", (status, expected) => {
        expect(subject.orderStatusOf(status)).toBe(expected)
    })
})
