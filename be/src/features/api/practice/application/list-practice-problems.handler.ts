import { QueryHandler } from "@nestjs/cqrs"
import { PracticeReadService, type PracticeProblemItemView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListPracticeProblemsQuery } from "./list-practice-problems.query"

@QueryHandler(ListPracticeProblemsQuery)
/** Hands the problems of one pattern to the practice capability. */
export class ListPracticeProblemsHandler extends ICQRSHandler<
    ListPracticeProblemsQuery,
    ReadonlyArray<PracticeProblemItemView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: PracticeReadService,
    ) {
        super(logger)
    }

    protected override process(query: ListPracticeProblemsQuery): Promise<ReadonlyArray<PracticeProblemItemView>> {
        return this.reads.problems({
            learnerId: query.params.principal.id,
            patternId: query.params.request.patternId,
            locale: query.params.request.locale,
        })
    }
}
