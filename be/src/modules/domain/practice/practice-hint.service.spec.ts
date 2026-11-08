import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction } from "@starci/jest-preset"
import { PRACTICE_LEARNER, practiceContentOf } from "@tests/fixtures/builders/practice.builder"
import { ENTITLEMENT_SERVICE } from "@modules/domain/entitlement"
import type { EntitlementService } from "@modules/domain/entitlement"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { PracticeHintService } from "./practice-hint.service"
import { PRACTICE_OPTIONS } from "./practice.decorators"
import type { PracticeOptions } from "./practice.options"
import type { HintMaxRow, ProblemRow } from "./persistence/practice.rows"
import { INSERT_HINT_REVEAL, LOCK_LEARNER, SELECT_HINT_HIGHEST, SELECT_PROBLEM } from "./persistence/practice.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")

const problemRow = (rank: number): ProblemRow => ({
    problem_id: "sum-two",
    version: "v1",
    pattern_id: "arrays",
    order_index: rank,
    difficulty: "easy",
    tags: [],
    time_limit_ms: 2000,
    memory_limit_kb: 262144,
    content: practiceContentOf("sum-two"),
    starter_codes: { cpp: "", java: "", javascript: "", python: "", typescript: "" },
    examples: [],
    rank,
    next_slug: null,
})

const build = async (
    problems: ReadonlyArray<ProblemRow>,
    highest: number | null,
    options: { premium?: boolean; free?: number } = {},
) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROBLEM, problems],
            [LOCK_LEARNER, []],
            [SELECT_HINT_HIGHEST, [{ highest } satisfies HintMaxRow]],
            [INSERT_HINT_REVEAL, []],
        ],
    })
    const tx: FakeTransaction = fakeTransaction(em)
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(options.premium ?? false)
    const practiceOptions: PracticeOptions = { freePerPattern: options.free ?? 1 }
    const moduleRef = await Test.createTestingModule({
        providers: [
            PracticeHintService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            {
                provide: PRACTICE_OPTIONS,
                useValue: practiceOptions,
            },
        ],
    }).compile()
    return { service: moduleRef.get(PracticeHintService), em, tx, entitlement }
}

describe("PracticeHintService reveal", () => {
    it("opens step 1 for a learner who can open the problem and answers the teacher's text in the locale", async () => {
        const { service, em, tx } = await build([problemRow(0)], null)

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 1, locale: "vi" }),
        ).resolves.toEqual({
            step: 1,
            title: "vi title 1",
            markdown: "vi hint 1",
        })

        expect(em.query).toHaveBeenCalledWith(INSERT_HINT_REVEAL, [PRACTICE_LEARNER, "sum-two", 1, NOW])
        expect(tx.commits).toBe(1)
    })

    it("opens the next step after the highest one opened", async () => {
        const { service, em } = await build([problemRow(0)], 2)

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 3, locale: "en" }),
        ).resolves.toMatchObject({ step: 3 })

        expect(em.query).toHaveBeenCalledWith(INSERT_HINT_REVEAL, [PRACTICE_LEARNER, "sum-two", 3, NOW])
    })

    it("answers an open step again without skipping ahead", async () => {
        const { service } = await build([problemRow(0)], 3)

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 2, locale: "en" }),
        ).resolves.toMatchObject({ step: 2 })
    })

    it("refuses a step that skips one and writes nothing", async () => {
        const { service, em, tx } = await build([problemRow(0)], 1)

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 3, locale: "en" }),
        ).rejects.toMatchObject({
            code: PracticeErrorCode.HintOutOfOrder,
        })

        expect(em.query).not.toHaveBeenCalledWith(INSERT_HINT_REVEAL, expect.anything())
        expect(tx.rollbacks).toBe(1)
    })
})

describe("PracticeHintService reveal refusals", () => {
    it("refuses step 2 before step 1 was ever opened", async () => {
        const { service } = await build([problemRow(0)], null)

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 2, locale: "en" }),
        ).rejects.toBeInstanceOf(PracticeError)
    })

    it("refuses a step the ladder does not have", async () => {
        const { service } = await build([problemRow(0)], 3)

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 4, locale: "en" }),
        ).rejects.toMatchObject({
            code: PracticeErrorCode.HintOutOfOrder,
        })
    })

    it("refuses an unknown problem", async () => {
        const { service } = await build([], null)

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "nope", step: 1, locale: "en" }),
        ).rejects.toMatchObject({
            code: PracticeErrorCode.ProblemNotFound,
        })
    })

    it("gives a locked problem no ladder unless the learner holds Premium", async () => {
        const locked = await build([problemRow(1)], null)

        await expect(
            locked.service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 1, locale: "en" }),
        ).rejects.toMatchObject({
            code: PracticeErrorCode.ProblemLocked,
        })

        const premium = await build([problemRow(1)], null, { premium: true })

        await expect(
            premium.service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 1, locale: "en" }),
        ).resolves.toMatchObject({ step: 1 })
    })

    it("opens a second problem when the app made two problems free", async () => {
        const { service } = await build([problemRow(1)], null, { free: 2 })

        await expect(
            service.reveal({ learnerId: PRACTICE_LEARNER, slug: "sum-two", step: 1, locale: "en" }),
        ).resolves.toMatchObject({ step: 1 })
    })
})
