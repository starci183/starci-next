import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { RecordMutationScoreParams } from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import { provedLevelOf } from "./outcome-level.policy"
import type { IncidentScoreRow } from "./persistence/attempt.rows"
import { RAISE_PROVED, UPSERT_INCIDENT_SCORE } from "./persistence/attempt.sql"

@Injectable()
/**
 * The only writer of the proved level. A graded attempt raises understanding only; an outcome is proved when the incident
 * mutation score of the learner in the lesson meets the threshold (owner ruling 2026-11-08).
 */
export class AttemptProofService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /**
     * Records the mutation score (percent, a whole number from 0 to 100) the tests of a learner reached in the incident of a
     * lesson, keeping the best, and proves the outcomes the learner fully understood once the best score meets the threshold.
     * Answers the proved level the lesson now gives (2 or 0). A score outside 0 to 100 is refused with ATTEMPT_ANSWER_INVALID.
     */
    async recordMutationScore(params: RecordMutationScoreParams): Promise<number> {
        if (!Number.isInteger(params.mutationScore) || params.mutationScore < 0 || params.mutationScore > 100) {
            throw new AttemptError({ code: AttemptErrorCode.AnswerInvalid })
        }
        const now = this.clock.now()
        return await this.entityManager.transaction(async (manager) => {
            const rows: Array<IncidentScoreRow> = await manager.query(UPSERT_INCIDENT_SCORE, [
                params.learnerId,
                params.lessonId,
                params.mutationScore,
                now,
            ])
            const proved = provedLevelOf(rows[0]?.mutation_score ?? null)
            if (proved > 0) await manager.query(RAISE_PROVED, [params.learnerId, params.lessonId, proved, now])
            return proved
        })
    }
}
