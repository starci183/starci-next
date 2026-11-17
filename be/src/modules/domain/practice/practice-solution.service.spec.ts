import { Test } from "@nestjs/testing"
import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import { PRACTICE_LEARNER, PRACTICE_HIDDEN_MARK } from "@tests/fixtures/builders/practice.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PracticeErrorCode } from "./errors/practice.error"
import { PracticeSolutionService } from "./practice-solution.service"
import type { SolutionRevealRow, SolutionRow } from "./persistence/practice.rows"
import { INSERT_SOLUTION_REVEAL, SELECT_SOLUTION, SELECT_SOLUTION_REVEAL } from "./persistence/practice.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const FIRST = new Date("2026-11-07T09:00:00.000Z")

const solutionRow: SolutionRow = {
    problem_id: "sum-two",
    solutions: {
        cpp: "int main() {}",
        java: "class A {}",
        javascript: "const a = 1",
        python: `print(${PRACTICE_HIDDEN_MARK})`,
        typescript: "const a = 1",
    },
    explanations: { vi: "vi explanation", en: "en explanation" },
}

const build = async (rows: ReadonlyArray<SolutionRow>, reveal: ReadonlyArray<SolutionRevealRow>) => {
    const em = mockEntityManager({
        query: [
            [SELECT_SOLUTION, rows],
            [INSERT_SOLUTION_REVEAL, []],
            [SELECT_SOLUTION_REVEAL, reveal],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            PracticeSolutionService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
        ],
    }).compile()
    return { service: moduleRef.get(PracticeSolutionService), em }
}

const ask = { learnerId: PRACTICE_LEARNER, slug: "sum-two", locale: "en" as const }

describe("PracticeSolutionService reveal", () => {
    it("records the reveal once and answers the solution in the locale, which no longer counts when it came before Accepted", async () => {
        const { service, em } = await build([solutionRow], [{ revealed_at: NOW, viewed_before_accepted: true }])

        const view = await service.reveal(ask)

        expect(view).toMatchObject({ slug: "sum-two", revealedAt: NOW, countedForExperience: false })
        expect(view.solution.startsWith("en explanation")).toBe(true)
        expect(view.solution).toContain(PRACTICE_HIDDEN_MARK)
        expect(em.query).toHaveBeenCalledWith(INSERT_SOLUTION_REVEAL, [PRACTICE_LEARNER, "sum-two", NOW])
    })

    it("keeps the first instant when the learner reveals again, and still counts a problem revealed after Accepted", async () => {
        const { service } = await build([solutionRow], [{ revealed_at: FIRST, viewed_before_accepted: false }])

        await expect(service.reveal({ ...ask, locale: "vi" })).resolves.toMatchObject({
            revealedAt: FIRST,
            countedForExperience: true,
        })
    })

    it("refuses an unknown problem and records nothing", async () => {
        const { service, em } = await build([], [])

        await expect(service.reveal(ask)).rejects.toMatchObject({ code: PracticeErrorCode.ProblemNotFound })

        expect(em.query).not.toHaveBeenCalledWith(INSERT_SOLUTION_REVEAL, expect.anything())
    })

    it("refuses a reveal the store cannot read back", async () => {
        const { service } = await build([solutionRow], [])

        await expect(service.reveal(ask)).rejects.toMatchObject({ code: PracticeErrorCode.NotSaved })
    })
})
