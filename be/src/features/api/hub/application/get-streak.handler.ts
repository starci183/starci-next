import { QueryHandler } from "@nestjs/cqrs"
import { StreakService, type StreakSummary } from "@modules/domain/streak"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetStreakQuery } from "./get-streak.query"

@QueryHandler(GetStreakQuery)
/** Answers the streak of the learner who asks. */
export class GetStreakHandler extends ICQRSHandler<GetStreakQuery, StreakSummary> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly streaks: StreakService,
    ) {
        super(logger)
    }

    protected override process(query: GetStreakQuery): Promise<StreakSummary> {
        return this.streaks.summary(query.params.principal.id)
    }
}
