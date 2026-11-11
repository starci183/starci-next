import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonContentService } from "@modules/domain/lesson"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { SaveSimulationProgressParams, SimulationProgressView } from "./attempt.contracts"
import { toSimulationView } from "./attempt.mapper"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import type { SimulationProgressRow } from "./persistence/attempt.rows"
import { UPSERT_SIMULATION_PROGRESS } from "./persistence/attempt.sql"
import { simulationPositionOf } from "./simulation-progress.policy"

@Injectable()
/**
 * Keeps where a learner stands in a simulation so a reload finds the same state: the current state, the path to it and every
 * branch ever tried. The path is replayed through the stored state machine before it is kept, so nothing impossible is saved.
 */
export class AttemptSimulationService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        private readonly content: LessonContentService,
    ) {}

    /**
     * Saves the position after a step or a step back. Premium is needed for every phase but the free one, as for a submit.
     * The branches tried only grow; the current state and the path are replaced.
     */
    async save(params: SaveSimulationProgressParams): Promise<SimulationProgressView> {
        const found = await this.content.activity({
            lessonId: params.lessonId,
            version: params.version,
            activityId: params.activityId,
            locale: params.locale,
        })
        if (found.phase === "retrieval") throw new AttemptError({ code: AttemptErrorCode.ActivityUnsupported })
        await this.content.requireAccess({
            learnerId: params.learnerId,
            phase: found.phase,
            isPremium: found.isPremium,
        })
        const position = simulationPositionOf(found.activity, params)
        const rows: Array<SimulationProgressRow> = await this.entityManager.query(UPSERT_SIMULATION_PROGRESS, [
            params.learnerId,
            params.lessonId,
            params.activityId,
            params.version,
            position.currentStateId,
            [...position.actionIds],
            [...position.transitionIds],
            this.clock.now(),
        ])
        const row = rows[0]
        if (row === undefined) throw new AttemptError({ code: AttemptErrorCode.NotSaved })
        return toSimulationView(row)
    }
}
