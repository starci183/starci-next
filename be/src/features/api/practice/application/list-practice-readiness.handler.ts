import { QueryHandler } from "@nestjs/cqrs"
import { PracticeReadService, type PracticeReadinessView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListPracticeReadinessQuery } from "./list-practice-readiness.query"

@QueryHandler(ListPracticeReadinessQuery)
/** Hands the readiness per pattern to the practice capability. */
export class ListPracticeReadinessHandler extends ICQRSHandler<
    ListPracticeReadinessQuery,
    ReadonlyArray<PracticeReadinessView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: PracticeReadService,
    ) {
        super(logger)
    }

    protected override process(query: ListPracticeReadinessQuery): Promise<ReadonlyArray<PracticeReadinessView>> {
        return this.reads.readiness({ learnerId: query.params.principal.id, locale: query.params.request.locale })
    }
}
