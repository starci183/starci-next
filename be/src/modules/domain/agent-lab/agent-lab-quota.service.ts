import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { DEFAULT_AGENT_LAB_DAILY_CALLS } from "./agent-lab.config"
import type { AgentQuotaView } from "./agent-lab.contracts"
import type { AgentLabOptions } from "./agent-lab.options"
import { InjectAgentLabOptions } from "./agent-lab.decorators"
import { AgentLabLogEvent } from "./agent-lab.log-events"
import { AgentLabError, AgentLabErrorCode } from "./errors/agent-lab.error"
import { CONSUME_CALL, SELECT_CALLS } from "./persistence/agent-lab.sql"

const DAY_MS = 86_400_000

@Injectable()
/**
 * The daily cap of model calls a learner makes through the StarCi proxy key (the OpenClaw and Hermes labs). The page reads
 * `quota`; the proxy that will issue the capped key (a later item) calls `consume` before each model call, and the lab stops
 * hard when the day's calls are used up. The claude track runs on the learner's own Anthropic account and never counts here.
 */
export class AgentLabQuotaService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectAgentLabOptions() private readonly options: AgentLabOptions,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /** The learner's quota for the current UTC day: the limit, the calls made, what is left and when the day ends. */
    async quota(learnerId: string): Promise<AgentQuotaView> {
        const rows: Array<{ calls: number }> = await this.entityManager.query(SELECT_CALLS, [learnerId, this.dayOf()])
        return this.viewOf(rows[0]?.calls ?? 0)
    }

    /** Counts one model call; at the day's limit it refuses with AGENT_LAB_QUOTA_EXHAUSTED and counts nothing. */
    async consume(learnerId: string): Promise<AgentQuotaView> {
        const rows: Array<{ calls: number }> = await this.entityManager.query(CONSUME_CALL, [
            learnerId,
            this.dayOf(),
            this.clock.now(),
            this.limit(),
        ])
        const row = rows[0]
        if (row === undefined) {
            this.logger.warn(AgentLabLogEvent.QuotaExhausted, { learnerId })
            throw new AgentLabError({ code: AgentLabErrorCode.QuotaExhausted })
        }
        return this.viewOf(row.calls)
    }

    private limit(): number {
        return this.options.dailyCalls ?? DEFAULT_AGENT_LAB_DAILY_CALLS
    }

    private dayOf(): string {
        return this.clock.now().toISOString().slice(0, 10)
    }

    private viewOf(used: number): AgentQuotaView {
        const limit = this.limit()
        const now = this.clock.now()
        const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        const remaining = Math.max(limit - used, 0)
        return {
            limit,
            used,
            remaining,
            exhausted: remaining === 0,
            resetsAt: new Date(dayStart + DAY_MS).toISOString(),
        }
    }
}
