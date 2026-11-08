import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"

const INSERT_PENDING = sql`INSERT INTO purchases (learner_id, plan, amount_vnd, currency, rail, order_code, status, created_at, updated_at, expires_at)
VALUES ($1::uuid, 'monthly', 229000, 'VND', $2, $3, 'pending', now(), now(), now() + interval '1 hour')`
const CONFIRMED_AT_OF = sql`SELECT confirmed_at FROM purchases WHERE rail = $1 AND order_code = $2`
const PREMIUM_OF = sql`SELECT premium_until FROM entitlements WHERE learner_id = $1::uuid`
const PURCHASE_BY_ORDER = sql`SELECT status, provider_ref FROM purchases WHERE rail = $1 AND order_code = $2`
const EVENTS_OF_ORDER = sql`SELECT e.kind FROM purchase_events e JOIN purchases p ON p.purchase_id = e.purchase_id WHERE p.rail = $1 AND p.order_code = $2 ORDER BY e.created_at`
const REFUSALS_OF_ORDER = sql`SELECT kind, reason, purchase_id IS NULL AS orphan, amount_vnd, currency FROM purchase_events WHERE rail = $1 AND order_code = $2 ORDER BY created_at`

/** The settlement facts of one purchase. */
export interface PurchaseState {
    readonly status: string
    readonly provider_ref: string | null
}

/** One audit row a verified delivery recorded without applying it. */
export interface RefusalRow {
    readonly kind: string
    readonly reason: string | null
    readonly orphan: boolean
    readonly amount_vnd: number | null
    readonly currency: string | null
}

/** The order a spec places, under a learner no other case uses. */
export interface PlacedOrder {
    readonly learnerId: string
    readonly orderCode: string
}

/** Reads the commerce ledger of the primary database a world runs: purchases, their audit events and the entitlement. */
export interface CommerceLedger {
    readonly purchaseOf: (rail: string, orderCode: string) => Promise<ReadonlyArray<PurchaseState>>
    readonly eventsOf: (rail: string, orderCode: string) => Promise<ReadonlyArray<string>>
    readonly refusalsOf: (rail: string, orderCode: string) => Promise<ReadonlyArray<RefusalRow>>
    readonly premiumOf: (learnerId: string) => Promise<string | null>
    readonly pendingOn: (rail: string) => Promise<PlacedOrder>
    /** Places another pending order for a learner a case already placed one for. */
    readonly pendingFor: (rail: string, learnerId: string) => Promise<PlacedOrder>
    /** The provider confirmation instant of one order, once it is settled. */
    readonly confirmedAtOf: (rail: string, orderCode: string) => Promise<Date | null>
}

/**
 * The ledger over `primary`; each `pendingOn` places a pending purchase under a learner and order code made from
 * `seed` and a running count, so cases never share an order.
 */
export const commerceLedgerOf = (primary: () => EntityManager | undefined, seed: number): CommerceLedger => {
    let sequence = 0
    return {
        purchaseOf: async (rail, orderCode) => (await primary()?.query(PURCHASE_BY_ORDER, [rail, orderCode])) ?? [],
        eventsOf: async (rail, orderCode) => {
            const rows: Array<{ kind: string }> = (await primary()?.query(EVENTS_OF_ORDER, [rail, orderCode])) ?? []
            return rows.map((row) => row.kind)
        },
        refusalsOf: async (rail, orderCode) => (await primary()?.query(REFUSALS_OF_ORDER, [rail, orderCode])) ?? [],
        premiumOf: async (learnerId) => {
            const rows: Array<{ premium_until: Date }> = (await primary()?.query(PREMIUM_OF, [learnerId])) ?? []
            return rows[0] ? rows[0].premium_until.toISOString() : null
        },
        pendingOn: async (rail) => {
            sequence += 1
            const learnerId = `${seed}0000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`
            const orderCode = String(seed * 1_000 + sequence)
            await primary()?.query(INSERT_PENDING, [learnerId, rail, orderCode])
            return { learnerId, orderCode }
        },
        pendingFor: async (rail, learnerId) => {
            sequence += 1
            const orderCode = String(seed * 1_000 + sequence)
            await primary()?.query(INSERT_PENDING, [learnerId, rail, orderCode])
            return { learnerId, orderCode }
        },
        confirmedAtOf: async (rail, orderCode) => {
            const rows: Array<{ confirmed_at: Date | null }> =
                (await primary()?.query(CONFIRMED_AT_OF, [rail, orderCode])) ?? []
            return rows[0]?.confirmed_at ?? null
        },
    }
}
