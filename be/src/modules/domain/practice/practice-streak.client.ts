import { Injectable } from "@nestjs/common"
import { StreakService } from "@modules/domain/streak"
import type { PracticeStreakAction } from "./practice.contracts"
import type { PracticeStreakPort } from "./practice-streak.port"

@Injectable()
/** The streak port over the app's streak: a graded attempt is one `practice` / `graded-attempt` action, counted once per attempt id. */
export class StreakServiceClient implements PracticeStreakPort {
    constructor(private readonly streak: StreakService) {}

    /** Reports the graded attempt to the streak under the attempt id, so a repeat counts once. */
    async recordStreakAction(action: PracticeStreakAction): Promise<void> {
        await this.streak.recordStreakAction(action.learnerId, action.shard, action.action, {
            actionId: action.actionId,
            sourceRef: action.sourceRef,
            at: action.at,
        })
    }
}
