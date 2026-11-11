import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER } from "@tests/fixtures/builders/attempt.builder"
import { simulationActivityOf } from "@tests/fixtures/builders/lesson.builder"
import { LessonContentService } from "@modules/domain/lesson"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { AttemptSimulationService } from "./attempt-simulation.service"
import { AttemptErrorCode } from "./errors/attempt.error"
import { UPSERT_SIMULATION_PROGRESS } from "./persistence/attempt.sql"

const NOW = new Date("2026-11-11T09:00:00.000Z")
const activity = simulationActivityOf("en")
const S0 = "demo--explore--s0"
const S1 = "demo--explore--s1"
const A1 = "demo--explore--a1"
const T1 = "demo--explore--t1"

const params = {
    learnerId: LEARNER,
    lessonId: "demo-lesson",
    version: "v1",
    activityId: "demo--explore",
    locale: "vi",
    currentStateId: S1,
    actionIds: [A1],
} as const

const build = async (phase: "explore" | "retrieval" = "explore") => {
    const em = mockEntityManager({
        query: [
            UPSERT_SIMULATION_PROGRESS,
            [
                {
                    activity_id: "demo--explore",
                    current_state_id: S1,
                    action_ids: [A1],
                    tried_transition_ids: [T1],
                    updated_at: NOW,
                },
            ],
        ],
    })
    const content = mock<LessonContentService>()
    content.activity.mockResolvedValue({ activity, phase })
    const moduleRef = await Test.createTestingModule({
        providers: [
            AttemptSimulationService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LessonContentService, useValue: content },
        ],
    }).compile()
    return { service: moduleRef.get(AttemptSimulationService), em, content }
}

describe("AttemptSimulationService save", () => {
    it("checks access, replays the path and keeps the position of the learner", async () => {
        const { service, em, content } = await build()

        const view = await service.save(params)

        expect(content.requireAccess).toHaveBeenCalledWith({ learnerId: LEARNER, phase: "explore" })
        expect(em.query).toHaveBeenCalledWith(UPSERT_SIMULATION_PROGRESS, [
            LEARNER,
            "demo-lesson",
            "demo--explore",
            "v1",
            S1,
            [A1],
            [T1],
            NOW,
        ])
        expect(view).toEqual({
            activityId: "demo--explore",
            currentStateId: S1,
            actionIds: [A1],
            triedTransitionIds: [T1],
            updatedAt: "2026-11-11T09:00:00.000Z",
        })
    })

    it("stores nothing for a path the machine does not allow", async () => {
        const { service, em } = await build()

        await expect(service.save({ ...params, currentStateId: S0 })).rejects.toMatchObject({
            code: AttemptErrorCode.AnswerInvalid,
        })
        expect(em.query).not.toHaveBeenCalled()
    })

    it("refuses a review activity", async () => {
        const { service } = await build("retrieval")

        await expect(service.save(params)).rejects.toMatchObject({ code: AttemptErrorCode.ActivityUnsupported })
    })
})
