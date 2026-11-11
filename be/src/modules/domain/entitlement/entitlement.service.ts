import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { eachInOrder } from "@modules/platform/primitives"
import { InjectEntitlementOptions } from "./entitlement.decorators"
import type { EntitlementOptions } from "./entitlement.options"
import type {
    DevGrantParams,
    Entitlement,
    GrantPremiumParams,
    OptionalPremiumUntil,
    PremiumUntilParams,
    RebuildPremiumParams,
} from "./entitlement.contracts"
import { EntitlementError, EntitlementErrorCode } from "./errors/entitlement.error"
import { toEntitlement, type EntitlementRow } from "./persistence/entitlement.rows"
import {
    DELETE_ENTITLEMENT,
    END_ENTITLEMENT,
    GRANT_ENTITLEMENT,
    SELECT_ENTITLEMENT,
} from "./persistence/entitlement.sql"

@Injectable()
/** Reads Premium access and applies terms already verified by the purchase capability. */
export class EntitlementService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementOptions() private readonly options: EntitlementOptions,
    ) {}

    /** The stored end instant, or null when the learner has never held Premium. */
    async premiumUntil(params: PremiumUntilParams): Promise<OptionalPremiumUntil> {
        const rows: Array<EntitlementRow> = await this.entityManager.query(SELECT_ENTITLEMENT, [params.learnerId])
        const row = rows[0]
        return row ? row.premium_until.toISOString() : null
    }

    /** Whether the learner's entitlement end is later than the current injected time. */
    async isPremium(learnerId: string): Promise<boolean> {
        const premiumUntil = await this.premiumUntil({ learnerId })
        return premiumUntil !== null && new Date(premiumUntil).getTime() > this.clock.now().getTime()
    }

    /** Grants a verified paid term, extending a future end and starting an expired term at confirmation. */
    grant(params: GrantPremiumParams): Promise<Entitlement> {
        return this.grantWith(this.entityManager, params)
    }

    /**
     * Development only: grants a term with no purchase, confirmed now, so a test learner can open the Premium screens. It is
     * refused ENTITLEMENT_DEV_GRANT_DISABLED unless the environment enables it; no door calls it, only `cli entitlement dev-grant`.
     */
    devGrant(params: DevGrantParams): Promise<Entitlement> {
        if (this.options.devGrant !== true) throw new EntitlementError({ code: EntitlementErrorCode.DevGrantDisabled })
        return this.grant({ learnerId: params.learnerId, term: params.term, confirmedAt: this.clock.now() })
    }

    /**
     * Grants a verified paid term through the caller's transaction: the purchase settlement passes its own manager, so the
     * paid mark and the grant commit together or not at all.
     */
    async grantWith(manager: EntityManager, params: GrantPremiumParams): Promise<Entitlement> {
        const months = params.term === "monthly" ? 1 : 12
        const rows: Array<EntitlementRow> = await manager.query(GRANT_ENTITLEMENT, [
            params.learnerId,
            params.confirmedAt,
            this.clock.now(),
            months,
        ])
        const row = rows[0]
        if (!row) throw new EntitlementError({ code: EntitlementErrorCode.EntitlementMissing })
        return toEntitlement(row)
    }

    /**
     * Rebuilds the learner's Premium end from the paid terms that still stand, through the caller's transaction: the stored
     * end is dropped and every standing grant is replayed in confirmation order with the same calendar arithmetic as the
     * grant, so removing one term shifts every later extension by exactly that term and touches no other. With no standing
     * grant the entitlement ends now.
     */
    async rebuildWith(manager: EntityManager, params: RebuildPremiumParams): Promise<Entitlement> {
        await manager.query(DELETE_ENTITLEMENT, [params.learnerId])
        let rebuilt: Entitlement | null = null
        await eachInOrder(params.grants, async (grant) => {
            rebuilt = await this.grantWith(manager, { learnerId: params.learnerId, ...grant })
        })
        if (rebuilt !== null) return rebuilt
        const rows: Array<EntitlementRow> = await manager.query(END_ENTITLEMENT, [params.learnerId, this.clock.now()])
        const row = rows[0]
        if (!row) throw new EntitlementError({ code: EntitlementErrorCode.EntitlementMissing })
        return toEntitlement(row)
    }
}
