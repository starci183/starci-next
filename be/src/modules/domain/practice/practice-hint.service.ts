import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import type { PracticeHintParams, PracticeHintText } from "./practice.contracts"
import type { HintMaxRow, ProblemRow } from "./persistence/practice.rows"
import { INSERT_HINT_REVEAL, LOCK_LEARNER, SELECT_HINT_HIGHEST, SELECT_PROBLEM } from "./persistence/practice.sql"

@Injectable()
/**
 * The hint ladder: three steps the teacher wrote for each problem, opened one after another and remembered per learner. The AI
 * never writes the hints and never writes code; the text comes from the problem version.
 */
export class PracticeHintService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /**
     * Opens one step of the ladder and answers its text. A step opens only after the step before it (step 1 is always open);
     * asking for an open step again answers it again.
     */
    async reveal(params: PracticeHintParams): Promise<PracticeHintText> {
        const { learnerId, slug, step, locale } = params
        const found: Array<ProblemRow> = await this.entityManager.query(SELECT_PROBLEM, [slug])
        const problem = found[0]
        if (problem === undefined) throw new PracticeError({ code: PracticeErrorCode.ProblemNotFound })
        const hint = problem.content[locale].hints.find((candidate) => candidate.step === step)
        if (hint === undefined) throw new PracticeError({ code: PracticeErrorCode.HintOutOfOrder })
        const now = this.clock.now()
        await this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_LEARNER, [learnerId])
            const rows: Array<HintMaxRow> = await manager.query(SELECT_HINT_HIGHEST, [learnerId, slug])
            if (step > (rows[0]?.highest ?? 0) + 1) throw new PracticeError({ code: PracticeErrorCode.HintOutOfOrder })
            await manager.query(INSERT_HINT_REVEAL, [learnerId, slug, step, now])
        })
        return hint
    }
}
