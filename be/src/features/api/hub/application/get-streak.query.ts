import { Query } from "@nestjs/cqrs"
import type { StreakSummary } from "@modules/domain/streak"
import type { ExecuteParams } from "@modules/platform/cqrs"

/** Asks for the whole streak of the signed-in learner. */
export class GetStreakQuery extends Query<StreakSummary> {
    constructor(readonly params: ExecuteParams<Record<string, never>>) {
        super()
    }
}
