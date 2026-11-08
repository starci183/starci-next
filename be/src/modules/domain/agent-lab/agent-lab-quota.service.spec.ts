import { Test } from "@nestjs/testing"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { AGENT_LAB_OPTIONS } from "./agent-lab.decorators"
import type { AgentLabOptions } from "./agent-lab.options"
import { AgentLabQuotaService } from "./agent-lab-quota.service"
import { CONSUME_CALL, SELECT_CALLS } from "./persistence/agent-lab.sql"

const LEARNER = "11111111-1111-4111-8111-111111111111"
const NOW = new Date("2026-11-08T10:00:00.000Z")

interface CallRow {
    readonly calls: number
}

interface QuotaRows {
    readonly select?: ReadonlyArray<CallRow>
    readonly consume?: ReadonlyArray<CallRow>
}

const build = async (rows: QuotaRows, options: AgentLabOptions = {}) => {
    const settings: AgentLabOptions = { ...options }
    const em = mockEntityManager({
        query: [
            [SELECT_CALLS, rows.select ?? []],
            [CONSUME_CALL, rows.consume ?? []],
        ],
    })
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            AgentLabQuotaService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: AGENT_LAB_OPTIONS, useValue: settings },
            { provide: LOGGER, useValue: logger },
        ],
    }).compile()
    return { service: moduleRef.get(AgentLabQuotaService), em, logger }
}

describe("AgentLabQuotaService quota", () => {
    it("starts a new day with the default 50 calls and the reset at the next UTC midnight", async () => {
        const { service, em } = await build({})

        await expect(service.quota(LEARNER)).resolves.toEqual({
            limit: 50,
            used: 0,
            remaining: 50,
            exhausted: false,
            resetsAt: "2026-11-09T00:00:00.000Z",
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_CALLS, [LEARNER, "2026-11-08"])
    })

    it("subtracts the calls made from the limit the app names", async () => {
        const { service } = await build({ select: [{ calls: 16 }] }, { dailyCalls: 50 })

        await expect(service.quota(LEARNER)).resolves.toMatchObject({ used: 16, remaining: 34, exhausted: false })
    })

    it("is exhausted at the limit and never goes below zero", async () => {
        const { service } = await build({ select: [{ calls: 60 }] }, { dailyCalls: 50 })

        await expect(service.quota(LEARNER)).resolves.toMatchObject({ remaining: 0, exhausted: true })
    })

    it("is exhausted for everyone at a limit of 0", async () => {
        const { service } = await build({}, { dailyCalls: 0 })

        await expect(service.quota(LEARNER)).resolves.toMatchObject({ limit: 0, remaining: 0, exhausted: true })
    })
})

describe("AgentLabQuotaService consume", () => {
    it("counts one call and answers the quota after it", async () => {
        const { service, em } = await build({ consume: [{ calls: 3 }] }, { dailyCalls: 5 })

        await expect(service.consume(LEARNER)).resolves.toMatchObject({ used: 3, remaining: 2, exhausted: false })
        expect(em.query).toHaveBeenCalledWith(CONSUME_CALL, [LEARNER, "2026-11-08", NOW, 5])
    })

    it("refuses with AGENT_LAB_QUOTA_EXHAUSTED when no call is left and logs the learner", async () => {
        const { service, logger } = await build({ consume: [] }, { dailyCalls: 5 })

        await expect(service.consume(LEARNER)).rejects.toMatchObject({ code: "AGENT_LAB_QUOTA_EXHAUSTED" })
        expect(logger.warn).toHaveBeenCalledWith("agent_lab.quota_exhausted", { learnerId: LEARNER })
    })
})
