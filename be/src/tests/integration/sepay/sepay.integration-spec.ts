import { SEPAY_CLIENT, SepayErrorCode, type SepayClient } from "@modules/integrations/sepay"
import { SEPAY_WORLD_IPN_HEADER, sepayModules } from "../../world/sepay-world.options"
import { useTestWorld } from "../../world/use-test-world"

const ipnOf = (): Record<string, unknown> => ({
    timestamp: 1_790_000_000,
    notification_type: "ORDER_PAID",
    order: {
        order_invoice_number: "SEPAY-7001",
        order_amount: "99000.00",
        order_currency: "VND",
        order_status: "CAPTURED",
    },
    transaction: { transaction_id: "sp-tx-7001", transaction_status: "APPROVED" },
    customer: {},
})

/**
 * sepay (integration): the SePay rail registered in the world. SePay is verified offline (a secret header and a signed form),
 * so it proves the paid IPN, the refused forgery as the rail's coded SepayErrorCode, and that a cut primary database does not
 * change what the rail proves.
 */
describe("sepay (integration)", () => {
    const world = useTestWorld({ modules: sepayModules })
    const sepay = (): SepayClient => world.resolve<SepayClient>(SEPAY_CLIENT)
    const headers = { "x-secret-key": SEPAY_WORLD_IPN_HEADER }

    it("proves a paid IPN carrying the configured secret key", () => {
        expect(sepay().verifyConfirmation({ body: ipnOf(), headers })).toEqual({
            kind: "ok",
            value: {
                rail: "sepay",
                state: "paid",
                providerRef: "sp-tx-7001",
                orderCode: "SEPAY-7001",
                amount: 99_000,
                currency: "VND",
            },
        })
    })

    it("refuses an IPN with a wrong secret key as SecretInvalid", () => {
        expect(sepay().verifyConfirmation({ body: ipnOf(), headers: { "x-secret-key": "forged" } })).toEqual({
            kind: "refused",
            code: SepayErrorCode.SecretInvalid,
        })
    })

    it("keeps proving a paid IPN while the primary database is cut", async () => {
        await world.interruptDatabase(() => {
            expect(sepay().verifyConfirmation({ body: ipnOf(), headers })).toMatchObject({ kind: "ok" })
            expect(sepay().verifyConfirmation({ body: { notification_type: "ORDER_PAID" }, headers })).toEqual({
                kind: "refused",
                code: SepayErrorCode.PayloadMalformed,
            })
            return Promise.resolve()
        })
    })
})
