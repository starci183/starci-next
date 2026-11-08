import { Test } from "@nestjs/testing"
import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PathErrorCode } from "./errors/path.error"
import { PATH_IDS } from "./path.contracts"
import { PathService } from "./path.service"
import type { ChoiceRow } from "./persistence/path.rows"
import { SELECT_CHOICE, UPSERT_CHOICE } from "./persistence/path.sql"

const LEARNER = "20000000-0000-4000-8000-000000000002"
const NOW = new Date("2026-11-11T03:00:00.000Z")

const build = async (rows: { chosen?: ChoiceRow; stored?: ChoiceRow } = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_CHOICE, rows.chosen === undefined ? [] : [rows.chosen]],
            [UPSERT_CHOICE, [rows.stored ?? { active_path_id: "ai-engineer", chosen_at: "2026-11-11T03:00:00.000Z" }]],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            PathService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
        ],
    }).compile()
    return { service: moduleRef.get(PathService), em }
}

describe("PathService catalog", () => {
    it("lists the five paths with no active path for a learner who chose none", async () => {
        const { service } = await build()

        const catalog = await service.catalog(LEARNER, "vi")

        expect(catalog.activePathId).toBeNull()
        expect(catalog.paths.map((path) => path.pathId)).toEqual([...PATH_IDS])
        expect(catalog.paths[0]?.title).not.toBe("Founder")
    })

    it("names the path the learner follows and words the paths in the asked locale", async () => {
        const { service } = await build({ chosen: { active_path_id: "devops-sre", chosen_at: NOW.toISOString() } })

        const catalog = await service.catalog(LEARNER, "en")

        expect(catalog.activePathId).toBe("devops-sre")
        expect(catalog.paths[0]?.title).toBe("Founder")
    })
})

describe("PathService active", () => {
    it("answers null for a learner who chose none", async () => {
        const { service } = await build()

        await expect(service.active(LEARNER, "vi")).resolves.toBeNull()
    })

    it("answers the followed path with its next three steps", async () => {
        const { service } = await build({ chosen: { active_path_id: "founder", chosen_at: NOW.toISOString() } })

        const active = await service.active(LEARNER, "en")

        expect(active).toMatchObject({ pathId: "founder", title: "Founder" })
        expect(active?.next).toHaveLength(3)
    })

    it("answers null when the stored path left the catalog", async () => {
        const { service } = await build({ chosen: { active_path_id: "retired", chosen_at: NOW.toISOString() } })

        await expect(service.active(LEARNER, "vi")).resolves.toBeNull()
    })
})

describe("PathService choose", () => {
    it("stores the path for the learner at the time of the clock and answers what the database holds", async () => {
        const { service, em } = await build({
            stored: { active_path_id: "founder", chosen_at: "2026-11-01T00:00:00.000Z" },
        })

        const chosen = await service.choose(LEARNER, "founder")

        expect(em.query).toHaveBeenCalledWith(UPSERT_CHOICE, [LEARNER, "founder", NOW])
        expect(chosen).toEqual({ activePathId: "founder", chosenAt: "2026-11-01T00:00:00.000Z" })
    })

    it("refuses an id outside the catalog with PATH_NOT_FOUND and stores nothing", async () => {
        const { service, em } = await build()

        await expect(service.choose(LEARNER, "astronaut")).rejects.toMatchObject({ code: PathErrorCode.NotFound })
        expect(em.query).not.toHaveBeenCalled()
    })
})
