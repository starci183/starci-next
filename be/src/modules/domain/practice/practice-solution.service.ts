import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { solutionMarkdownOf } from "./practice-solution.policy"
import type { PracticeProblemParams, PracticeSolutionView } from "./practice.contracts"
import type { SolutionRevealRow, SolutionRow } from "./persistence/practice.rows"
import { INSERT_SOLUTION_REVEAL, SELECT_SOLUTION, SELECT_SOLUTION_REVEAL } from "./persistence/practice.sql"

@Injectable()
/**
 * The reference solution of a problem: a learner may reveal it at any time, once. The reveal is stored (the same learner and
 * problem keep their first instant) so that a problem whose solution was seen before its first Accepted stays out of the
 * experience a pattern grants; a reveal after the first Accepted changes nothing.
 */
export class PracticeSolutionService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** Records the reveal (idempotent) and answers the solution in the locale with the standing of the reveal. */
    async reveal(params: PracticeProblemParams): Promise<PracticeSolutionView> {
        const { learnerId, slug, locale } = params
        const found: Array<SolutionRow> = await this.entityManager.query(SELECT_SOLUTION, [slug])
        const problem = found[0]
        if (problem === undefined) throw new PracticeError({ code: PracticeErrorCode.ProblemNotFound })
        await this.entityManager.query(INSERT_SOLUTION_REVEAL, [learnerId, slug, this.clock.now()])
        const rows: Array<SolutionRevealRow> = await this.entityManager.query(SELECT_SOLUTION_REVEAL, [learnerId, slug])
        const reveal = rows[0]
        if (reveal === undefined) throw new PracticeError({ code: PracticeErrorCode.NotSaved })
        return {
            slug,
            solution: solutionMarkdownOf(problem.explanations, problem.solutions, locale),
            revealedAt: reveal.revealed_at,
            countedForExperience: !reveal.viewed_before_accepted,
        }
    }
}
