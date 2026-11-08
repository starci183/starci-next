import { Test } from "@nestjs/testing"
import { sepayDeliveryAuthorized, sepayIpnOf, sepayOrderOf, sepayPaymentStateOf } from "./sepay-confirmation.policy"
import type { SepayIpn } from "./sepay-confirmation.policy"

const SECRET_KEY = "spec-ipn-secret-key"
const POLICY: unique symbol = Symbol("sepay.confirmation-policy")

const subject = async (): Promise<{
    readonly authorized: typeof sepayDeliveryAuthorized
    readonly ipnOf: typeof sepayIpnOf
    readonly orderOf: typeof sepayOrderOf
    readonly stateOf: typeof sepayPaymentStateOf
}> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            {
                provide: POLICY,
                useFactory: () => ({
                    authorized: sepayDeliveryAuthorized,
                    ipnOf: sepayIpnOf,
                    orderOf: sepayOrderOf,
                    stateOf: sepayPaymentStateOf,
                }),
            },
        ],
    }).compile()
    return moduleRef.get(POLICY)
}

describe("sepayDeliveryAuthorized", () => {
    it("is true only for the exact `x-secret-key` value", async () => {
        const { authorized } = await subject()

        expect(authorized({}, SECRET_KEY)).toBe(false)
        expect(authorized({ "x-secret-key": `${SECRET_KEY}-x` }, SECRET_KEY)).toBe(false)
        expect(authorized({ "x-secret-key": `${SECRET_KEY} ` }, SECRET_KEY)).toBe(false)
        expect(authorized({ "x-secret-key": SECRET_KEY }, SECRET_KEY)).toBe(true)
    })
})

describe("sepayIpnOf", () => {
    const notification = {
        timestamp: 1_757_058_220,
        notification_type: "ORDER_PAID",
        order: { order_invoice_number: "SUB_1" },
        transaction: { transaction_id: "T1" },
    }

    it("is null unless the body is a record with a readable envelope", async () => {
        const { ipnOf } = await subject()

        expect(ipnOf(null)).toBeNull()
        expect(ipnOf("x")).toBeNull()
        expect(ipnOf([notification])).toBeNull()
        expect(ipnOf({ ...notification, timestamp: "soon" })).toBeNull()
        expect(ipnOf({ ...notification, timestamp: Number.NaN })).toBeNull()
        expect(ipnOf({ ...notification, notification_type: 1 })).toBeNull()
        expect(ipnOf({ ...notification, notification_type: "" })).toBeNull()
        expect(ipnOf({ ...notification, order: "x" })).toBeNull()
        expect(ipnOf({ ...notification, transaction: [1] })).toBeNull()
    })

    it("reads a documented IPN envelope", async () => {
        const { ipnOf } = await subject()

        expect(ipnOf(notification)).toEqual({
            notificationType: "ORDER_PAID",
            order: notification.order,
            transaction: notification.transaction,
        })
    })
})

describe("sepayOrderOf", () => {
    const ipn: SepayIpn = {
        notificationType: "ORDER_PAID",
        order: { order_invoice_number: "SUB_1", order_amount: "229000.00", order_currency: "VND" },
        transaction: { transaction_id: "T1" },
    }

    it.each([
        ["order_invoice_number", 1],
        ["order_invoice_number", ""],
        ["order_amount", "abc"],
        ["order_amount", "-5"],
        ["order_amount", Number.NaN],
        ["order_amount", 0],
        ["order_amount", -1],
    ] as const)("is null when order's %s is %s", async (field, value) => {
        const { orderOf } = await subject()

        expect(orderOf({ ...ipn, order: { ...ipn.order, [field]: value } })).toBeNull()
    })

    it.each([
        ["transaction_id", 1],
        ["transaction_id", ""],
    ] as const)("is null when transaction's %s is %s", async (field, value) => {
        const { orderOf } = await subject()

        expect(orderOf({ ...ipn, transaction: { ...ipn.transaction, [field]: value } })).toBeNull()
    })

    it("reads the paid-order facts of a verified notification, decimal text or number", async () => {
        const { orderOf } = await subject()

        expect(orderOf(ipn)).toEqual({ orderCode: "SUB_1", amount: 229000, currency: "VND", providerRef: "T1" })
        expect(orderOf({ ...ipn, order: { ...ipn.order, order_amount: 50000, order_currency: 1 } })).toEqual({
            orderCode: "SUB_1",
            amount: 50000,
            currency: "",
            providerRef: "T1",
        })
    })
})

describe("sepayPaymentStateOf", () => {
    const paid: SepayIpn = {
        notificationType: "ORDER_PAID",
        order: { order_status: "CAPTURED" },
        transaction: { transaction_status: "APPROVED" },
    }

    it("is paid only for an ORDER_PAID whose order is CAPTURED and transaction APPROVED", async () => {
        const { stateOf } = await subject()

        expect(stateOf(paid)).toBe("paid")
        expect(stateOf({ ...paid, order: { order_status: "CANCELLED" } })).toBe("unpaid")
        expect(stateOf({ ...paid, transaction: { transaction_status: "DECLINED" } })).toBe("unpaid")
        expect(stateOf({ ...paid, notificationType: "ORDER_CREATED" })).toBe("unpaid")
    })

    it("is voided for a TRANSACTION_VOID whatever its statuses", async () => {
        const { stateOf } = await subject()

        expect(stateOf({ ...paid, notificationType: "TRANSACTION_VOID" })).toBe("voided")
    })
})
