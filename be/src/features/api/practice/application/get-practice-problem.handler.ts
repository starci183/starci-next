import { QueryHandler } from "@nestjs/cqrs"
import { PracticeReadService, type PracticeProblemView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetPracticeProblemQuery } from "./get-practice-problem.query"

@QueryHandler(GetPracticeProblemQuery)
/** Hands one problem to open to the practice capability. */
export class GetPracticeProblemHandler extends ICQRSHandler<GetPracticeProblemQuery, PracticeProblemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: PracticeReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetPracticeProblemQuery): Promise<PracticeProblemView> {
        return this.reads.problem({
            learnerId: query.params.principal.id,
            slug: query.params.request.slug,
            locale: query.params.request.locale,
        })
    }
}
