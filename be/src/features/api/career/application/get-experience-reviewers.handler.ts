import { QueryHandler } from "@nestjs/cqrs"
import { ReviewerService, type ReviewerView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetExperienceReviewersQuery } from "./get-experience-reviewers.query"

@QueryHandler(GetExperienceReviewersQuery)
/** Hands the message to the career capability, which authorizes and decides. */
export class GetExperienceReviewersHandler extends ICQRSHandler<
    GetExperienceReviewersQuery,
    ReadonlyArray<ReviewerView>
> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reviewers: ReviewerService,
    ) {
        super(logger)
    }

    protected override process(query: GetExperienceReviewersQuery): Promise<ReadonlyArray<ReviewerView>> {
        return this.reviewers.list({ subject: query.params.principal.id, roles: query.params.request.roles })
    }
}
