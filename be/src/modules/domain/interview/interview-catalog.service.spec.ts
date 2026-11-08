import { DEFAULT_INTERVIEW_SETTINGS } from "./interview.config"
import type { InterviewSettings } from "./interview.options"
import { FakeClock, mock, mockEntityManager, builder } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER, sessionRowOf } from "@tests/fixtures/builders/interview.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { InterviewAccessService } from "./interview-access.service"
import { InterviewCatalogService } from "./interview-catalog.service"
import { INTERVIEW_RESOLVED_OPTIONS } from "./interview.decorators"
import { ABANDON_IDLE, SELECT_ACTIVE_SESSION, SELECT_BANK_OPTIONS } from "./persistence/interview.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")

const bank = (id: string, family: string) => ({
    bank_id: id,
    family,
    title: id,
    difficulty: "medium",
    tiers: ["junior"],
    languages: ["agnostic"],
    question_count: 15,
    free_question_count: 15,
})

const build = async (active: ReadonlyArray<object>) => {
    const em = mockEntityManager({
        query: [
            [ABANDON_IDLE, []],
            [
                SELECT_BANK_OPTIONS,
                [
                    bank("0-fullstack-mastery/0-framework-foundation", "technical"),
                    bank("2-devops-mastery/0-bank", "technical"),
                    bank("eq/1-behavioral", "behavioral"),
                ],
            ],
            [SELECT_ACTIVE_SESSION, active],
        ],
    })
    const access = mock<InterviewAccessService>()
    access.accessOf.mockResolvedValue({
        isPremium: false,
        freeSessionsLeftThisMonth: 1,
        resetsAt: "2026-11-30T17:00:00.000Z",
        length: 3,
        freeMonth: "2026-11",
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            InterviewCatalogService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: INTERVIEW_RESOLVED_OPTIONS, useValue: builder<InterviewSettings>(DEFAULT_INTERVIEW_SETTINGS)() },
            { provide: InterviewAccessService, useValue: access },
        ],
    }).compile()
    return { service: moduleRef.get(InterviewCatalogService), em }
}

describe("InterviewCatalogService options", () => {
    it("lists the tracks and every live bank, the access of the learner and no session in progress, after abandoning idle ones", async () => {
        const { service, em } = await build([])

        const view = await service.options(LEARNER, "en", "")

        expect(view.tracks.map((track) => track.id)).toEqual([
            "backend-fullstack",
            "devops-sre",
            "system-design-senior",
            "ai-engineer",
            "founder",
        ])
        expect(view.banks.map((entry) => entry.bankId)).toHaveLength(3)
        expect(view.access).toEqual({
            isPremium: false,
            freeSessionsLeftThisMonth: 1,
            resetsAt: "2026-11-30T17:00:00.000Z",
            length: 3,
        })
        expect(view.active).toBeNull()
        expect(em.query).toHaveBeenCalledWith(ABANDON_IDLE, [LEARNER, new Date("2026-11-08T09:00:00.000Z"), NOW])
    })

    it("narrows the banks to a track, titles them in the locale and shows the session in progress", async () => {
        const { service } = await build([sessionRowOf({ overall_score: null, verdict: null })])

        const view = await service.options(LEARNER, "vi", "devops-sre")

        expect(view.banks.map((entry) => entry.bankId)).toEqual(["2-devops-mastery/0-bank", "eq/1-behavioral"])
        expect(view.tracks[0]?.title).toBe("Backend / Fullstack")
        expect(view.active).toMatchObject({ status: "active", track: "backend-fullstack" })
    })

    it("shows every bank for a track id it does not know", async () => {
        const { service } = await build([])

        expect((await service.options(LEARNER, "vi", "nope")).banks).toHaveLength(3)
    })
})
