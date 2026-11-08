import { QueryHandler } from "@nestjs/cqrs"
import { PracticeReadService, type PracticePatternView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListPracticePatternsQuery } from "./list-practice-patterns.query"

@QueryHandler(ListPracticePatternsQuery)
/** Hands the pattern list of the signed-in learner to the practice capability. */
export class ListPracticePatternsHandler extends ICQRSHandler<
    ListPracticePatternsQuery,
    ReadonlyArray<PracticePatternView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: PracticeReadService,
    ) {
        super(logger)
    }

    protected override process(query: ListPracticePatternsQuery): Promise<ReadonlyArray<PracticePatternView>> {
        return this.reads.patterns({ learnerId: query.params.principal.id, locale: query.params.request.locale })
    }
}
