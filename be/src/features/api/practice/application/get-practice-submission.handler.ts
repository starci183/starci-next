import { QueryHandler } from "@nestjs/cqrs"
import { PracticeSubmissionService, type PracticeSubmissionView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetPracticeSubmissionQuery } from "./get-practice-submission.query"

@QueryHandler(GetPracticeSubmissionQuery)
/** Hands one submission of the caller to the practice capability. */
export class GetPracticeSubmissionHandler extends ICQRSHandler<GetPracticeSubmissionQuery, PracticeSubmissionView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly submissions: PracticeSubmissionService,
    ) {
        super(logger)
    }

    protected override process(query: GetPracticeSubmissionQuery): Promise<PracticeSubmissionView> {
        return this.submissions.read(query.params.principal.id, query.params.request.submissionId)
    }
}
