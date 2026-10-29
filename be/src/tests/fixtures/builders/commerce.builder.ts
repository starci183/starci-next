import { builder } from "@starci/jest-preset"
import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"

const INSERT_PENDING = sql`INSERT INTO purchases (learner_id, plan, amount_vnd, currency, rail, order_code, status, created_at, updated_at, expires_at)
VALUES ($1::uuid, $2, $3, 'VND', $4, $5, 'pending', now(), now(), now() + interval '1 hour')`

/** The facts of one pending purchase a rail's confirmation is later aimed at. */
export interface PendingPurchase {
    readonly learnerId: string
    readonly plan: string
    readonly amountVnd: number
    readonly rail: string
    readonly orderCode: string
}

/** A valid pending SePay purchase of the monthly plan; override the fields that matter to the case. */
export const pendingPurchaseOf = builder<PendingPurchase>({
    learnerId: "10000000-0000-4000-8000-000000000041",
    plan: "premium-monthly",
    amountVnd: 99_000,
    rail: "sepay",
    orderCode: "SEPAY-1001",
})

/** Persists one pending purchase row through the manager and answers the facts it was written with. */
export const persistPendingPurchase = async (
    manager: EntityManager,
    overrides?: Partial<PendingPurchase>,
): Promise<PendingPurchase> => {
    const purchase = pendingPurchaseOf(overrides)
    await manager.query(INSERT_PENDING, [
        purchase.learnerId,
        purchase.plan,
        purchase.amountVnd,
        purchase.rail,
        purchase.orderCode,
    ])
    return purchase
}
