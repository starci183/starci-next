import { mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER } from "@tests/fixtures/builders/interview.builder"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { InterviewHistoryService } from "./interview-history.service"
import { SELECT_EVIDENCE, SELECT_HISTORY } from "./persistence/interview.sql"

const at = new Date("2026-11-08T10:00:00.000Z")
const evidence = (family: string, verdict: string, tier = "junior", track = "backend-fullstack") => ({
    track,
    family,
    tier,
    score: 80,
    verdict,
    session_id: "s",
    graded_at: at,
})

const build = async (rows: ReadonlyArray<object>) => {
    const em = mockEntityManager({
        query: [
            [
                SELECT_HISTORY,
                [
                    {
                        session_id: "s",
                        track: "backend-fullstack",
                        tier: "junior",
                        started_at: at,
                        status: "graded",
                        overall_score: 75,
                        verdict: "pass",
                    },
                ],
            ],
            [SELECT_EVIDENCE, rows],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [InterviewHistoryService, { provide: PRIMARY_ENTITY_MANAGER, useValue: em }],
    }).compile()
    return { service: moduleRef.get(InterviewHistoryService), em }
}

describe("InterviewHistoryService", () => {
    it("lists the sessions of the learner with the trend", async () => {
        const { service, em } = await build([])

        await expect(service.history(LEARNER, "backend-fullstack")).resolves.toMatchObject({
            items: [{ sessionId: "s", overallScore: 75 }],
            trend: [{ track: "backend-fullstack", tier: "junior", scores: [75] }],
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_HISTORY, [LEARNER, "backend-fullstack", 500])
    })

    it("reads the sessions of every track when no track is named", async () => {
        const { service, em } = await build([])

        await expect(service.history(LEARNER, null)).resolves.toMatchObject({ items: [{ sessionId: "s" }] })
        expect(em.query).toHaveBeenCalledWith(SELECT_HISTORY, [LEARNER, "", 500])
    })

    it("lists the best result per track, pillar and tier as evidence", async () => {
        const { service } = await build([evidence("technical", "pass")])

        await expect(service.evidence(LEARNER)).resolves.toEqual([
            {
                track: "backend-fullstack",
                family: "technical",
                tier: "junior",
                bestScore: 80,
                verdict: "pass",
                sessionId: "s",
                gradedAt: at.toISOString(),
            },
        ])
    })

    it("is ready at a tier only when both pillars passed there", async () => {
        const both = await build([
            evidence("technical", "pass"),
            evidence("behavioral", "pass"),
            evidence("technical", "fail", "senior"),
        ])
        const one = await build([evidence("technical", "pass"), evidence("behavioral", "borderline")])
        const none = await build([evidence("technical", "pass", "junior", "devops-sre")])

        await expect(both.service.readiness(LEARNER, "backend-fullstack", "junior")).resolves.toMatchObject({
            ready: true,
            technical: { bestScore: 80, verdict: "pass" },
            behavioral: { verdict: "pass" },
        })
        await expect(one.service.readiness(LEARNER, "backend-fullstack", "junior")).resolves.toMatchObject({
            ready: false,
            behavioral: { verdict: "borderline" },
        })
        await expect(none.service.readiness(LEARNER, "backend-fullstack", "junior")).resolves.toEqual({
            track: "backend-fullstack",
            tier: "junior",
            technical: null,
            behavioral: null,
            ready: false,
        })
    })
})
