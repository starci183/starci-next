import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock } from "@modules/platform/clock"
import type { Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { Entitlement, GrantPremiumParams } from "./entitlement.contracts"
import { EntitlementError, EntitlementErrorCode } from "./errors/entitlement.error"
import { toEntitlement } from "./persistence/entitlement.rows"
import type { EntitlementRow } from "./persistence/entitlement.rows"
import { GRANT_ENTITLEMENT, SELECT_ENTITLEMENT } from "./persistence/entitlement.sql"

@Injectable()
/** Reads Premium access and applies terms already verified by the purchase capability. */
export class EntitlementService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** The stored end instant, or null when the learner has never held Premium. */
    async premiumUntil(learnerId: string): Promise<string | null> {
        const rows: Array<EntitlementRow> = await this.entityManager.query(SELECT_ENTITLEMENT, [learnerId])
        const row = rows[0]
        return row ? row.premium_until.toISOString() : null
    }

    /** Whether the learner's entitlement end is later than the current injected time. */
    async isPremium(learnerId: string): Promise<boolean> {
        const premiumUntil = await this.premiumUntil(learnerId)
        return premiumUntil !== null && new Date(premiumUntil).getTime() > this.clock.now().getTime()
    }

    /** Grants a verified paid term, extending a future end and starting an expired term at confirmation. */
    async grant(params: GrantPremiumParams): Promise<Entitlement> {
        const months = params.term === "monthly" ? 1 : 12
        const rows: Array<EntitlementRow> = await this.entityManager.query(GRANT_ENTITLEMENT, [
            params.learnerId,
            params.confirmedAt,
            this.clock.now(),
            months,
        ])
        const row = rows[0]
        if (!row) throw new EntitlementError({ code: EntitlementErrorCode.EntitlementMissing })
        return toEntitlement(row)
    }
}
