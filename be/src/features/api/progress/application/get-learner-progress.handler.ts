import { QueryHandler } from "@nestjs/cqrs"
import { ProgressService, type LearnerProgressView } from "@modules/domain/progress"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLearnerProgressQuery } from "./get-learner-progress.query"

@QueryHandler(GetLearnerProgressQuery)
/** Builds the progress page of the learner who asks. */
export class GetLearnerProgressHandler extends ICQRSHandler<GetLearnerProgressQuery, LearnerProgressView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly progress: ProgressService,
    ) {
        super(logger)
    }

    protected override process(query: GetLearnerProgressQuery): Promise<LearnerProgressView> {
        return this.progress.read(query.params.principal.id, query.params.request.locale)
    }
}
