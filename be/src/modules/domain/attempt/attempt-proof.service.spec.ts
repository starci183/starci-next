import { FakeClock, fakeTransaction, mockEntityManager, type FakeTransaction } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LEARNER } from "@tests/fixtures/builders/attempt.builder"
import { callsOf, type QueryStub } from "@tests/fixtures/builders/attempt-stub.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { AttemptProofService } from "./attempt-proof.service"
import { AttemptErrorCode } from "./errors/attempt.error"
import { RAISE_PROVED, UPSERT_INCIDENT_SCORE } from "./persistence/attempt.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")

const build = async (queries: ReadonlyArray<QueryStub>) => {
    const tx: FakeTransaction = fakeTransaction(mockEntityManager({ query: queries }))
    const moduleRef = await Test.createTestingModule({
        providers: [
            AttemptProofService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
        ],
    }).compile()
    return { service: moduleRef.get(AttemptProofService), tx }
}

describe("AttemptProofService recordMutationScore", () => {
    const record = (mutationScore: number) => ({ learnerId: LEARNER, lessonId: "demo-lesson", mutationScore })

    it("proves the fully understood outcomes when the best score meets the threshold", async () => {
        const { service, tx } = await build([
            [UPSERT_INCIDENT_SCORE, [{ mutation_score: 85 }]],
            [RAISE_PROVED, []],
        ])

        expect(await service.recordMutationScore(record(85))).toBe(2)
        expect(callsOf(tx, UPSERT_INCIDENT_SCORE)).toEqual([[LEARNER, "demo-lesson", 85, NOW]])
        expect(callsOf(tx, RAISE_PROVED)).toEqual([[LEARNER, "demo-lesson", 2, NOW]])
    })

    it("proves nothing below the threshold", async () => {
        const { service, tx } = await build([[UPSERT_INCIDENT_SCORE, [{ mutation_score: 79 }]]])

        expect(await service.recordMutationScore(record(79))).toBe(0)
        expect(callsOf(tx, RAISE_PROVED)).toEqual([])
    })

    it("keeps the best score: a weak rerun after a passing run still proves", async () => {
        const { service, tx } = await build([
            [UPSERT_INCIDENT_SCORE, [{ mutation_score: 90 }]],
            [RAISE_PROVED, []],
        ])

        expect(await service.recordMutationScore(record(10))).toBe(2)
        expect(callsOf(tx, UPSERT_INCIDENT_SCORE)).toEqual([[LEARNER, "demo-lesson", 10, NOW]])
        expect(callsOf(tx, RAISE_PROVED)).toHaveLength(1)
    })

    it.each([-1, 101, 80.5, Number.NaN])("refuses the score %s", async (score) => {
        const { service, tx } = await build([])

        await expect(service.recordMutationScore(record(score))).rejects.toMatchObject({
            code: AttemptErrorCode.AnswerInvalid,
        })
        expect(tx.em.query).not.toHaveBeenCalled()
    })
})
