import { createHmac } from "node:crypto"
import { builder } from "@starci/jest-preset"
import { sql } from "@modules/platform/database"
import { persistPendingPurchase } from "../../fixtures/builders/commerce.builder"
import { useTestWorld } from "../../world/use-test-world"

const PURCHASE_BY_ORDER = sql`SELECT rail, order_code, status, provider_ref, confirmed_at FROM purchases WHERE rail = $1 AND order_code = $2`
const EVENT_COUNT = sql`SELECT count(*)::int AS total FROM purchase_events`
const ENTITLEMENT_COUNT = sql`SELECT count(*)::int AS total FROM entitlements`

interface PurchaseRow {
    rail: string
    order_code: string
    status: string
    provider_ref: string | null
    confirmed_at: Date | null
}

const payosDataOf = builder<Record<string, unknown>>({
    amount: 99_000,
    description: "StarCi Premium monthly",
    orderCode: 1_001,
    reference: "FT-1001",
})

/** Signs under a key no deployment holds: the delivery looks right and proves nothing. */
const forgedPayosBody = (data: Record<string, unknown>): Record<string, unknown> => ({
    code: "00",
    desc: "success",
    success: true,
    data,
    signature: createHmac("sha256", "a-key-the-deployment-never-held")
        .update(
            Object.keys(data)
                .sort()
                .map((key) => `${key}=${String(data[key])}`)
                .join("&"),
            "utf8",
        )
        .digest("hex"),
})

const sepayIpnOf = builder<Record<string, unknown>>({
    timestamp: 1_790_000_000,
    notification_type: "ORDER_PAID",
    order: { order_invoice_number: "SEPAY-1001", order_amount: "99000.00" },
    transaction: { transaction_id: "sp-tx-1001" },
    customer: {},
})

/** The production core app's provider webhook doors: a forged delivery changes nothing that is persisted. */
describe("payment rails webhook doors (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })

    const purchaseOf = (rail: string, orderCode: string): Promise<Array<PurchaseRow>> =>
        world.db.primary.query<Array<PurchaseRow>>(PURCHASE_BY_ORDER, [rail, orderCode])
    const totalOf = async (statement: typeof EVENT_COUNT): Promise<number> => {
        const rows = await world.db.primary.query<Array<{ total: number }>>(statement)
        return rows[0]?.total ?? -1
    }

    it("refuses a SePay IPN that carries a wrong secret key and leaves the pending purchase untouched", async () => {
        await persistPendingPurchase(world.db.primary, { rail: "sepay", orderCode: "SEPAY-1001" })

        const response = await world.apps.core.api.post("/webhooks/sepay", sepayIpnOf(), {
            headers: { "x-secret-key": "not-the-ipn-secret" },
        })
        const rows = await purchaseOf("sepay", "SEPAY-1001")

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(500)
        expect(rows).toEqual([{ rail: "sepay", order_code: "SEPAY-1001", status: "pending", provider_ref: null, confirmed_at: null }])
        expect(await totalOf(EVENT_COUNT)).toBe(0)
        expect(await totalOf(ENTITLEMENT_COUNT)).toBe(0)
    })

    it("refuses a SePay IPN that carries no secret key at all", async () => {
        await persistPendingPurchase(world.db.primary, { rail: "sepay", orderCode: "SEPAY-1002" })

        const response = await world.apps.core.api.post("/webhooks/sepay", sepayIpnOf())
        const rows = await purchaseOf("sepay", "SEPAY-1002")

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(500)
        expect(rows).toEqual([{ rail: "sepay", order_code: "SEPAY-1002", status: "pending", provider_ref: null, confirmed_at: null }])
        expect(await totalOf(EVENT_COUNT)).toBe(0)
    })

    it("refuses a payOS webhook signed under a key the deployment never held and leaves the purchase pending", async () => {
        await persistPendingPurchase(world.db.primary, { rail: "payos", orderCode: "1001" })

        const response = await world.apps.core.api.post("/webhooks/payos", forgedPayosBody(payosDataOf()))
        const rows = await purchaseOf("payos", "1001")

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(500)
        expect(rows).toEqual([{ rail: "payos", order_code: "1001", status: "pending", provider_ref: null, confirmed_at: null }])
        expect(await totalOf(EVENT_COUNT)).toBe(0)
        expect(await totalOf(ENTITLEMENT_COUNT)).toBe(0)
    })

    it("refuses a payOS delivery that is not a webhook envelope", async () => {
        const response = await world.apps.core.api.post("/webhooks/payos", { hello: "world" })

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(500)
        expect(await totalOf(EVENT_COUNT)).toBe(0)
    })
})
