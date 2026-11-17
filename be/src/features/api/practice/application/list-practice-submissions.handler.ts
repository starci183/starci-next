import { QueryHandler } from "@nestjs/cqrs"
import { PracticeHistoryService, type PracticeSubmissionsPageView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListPracticeSubmissionsQuery } from "./list-practice-submissions.query"

@QueryHandler(ListPracticeSubmissionsQuery)
/** Hands the submission history read of the signed-in learner to the practice capability. */
export class ListPracticeSubmissionsHandler extends ICQRSHandler<
    ListPracticeSubmissionsQuery,
    PracticeSubmissionsPageView
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly history: PracticeHistoryService,
    ) {
        super(logger)
    }

    protected override process(query: ListPracticeSubmissionsQuery): Promise<PracticeSubmissionsPageView> {
        return this.history.submissions({
            learnerId: query.params.principal.id,
            patternId: query.params.request.patternId,
            locale: query.params.request.locale,
            limit: query.params.request.limit,
            cursor: query.params.request.cursor,
        })
    }
}
