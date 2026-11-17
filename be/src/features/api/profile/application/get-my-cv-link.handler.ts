import { QueryHandler } from "@nestjs/cqrs"
import { ProfileCvService, type CvLinkView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetMyCvLinkQuery } from "./get-my-cv-link.query"

@QueryHandler(GetMyCvLinkQuery)
/** Hands the CV link read of the signed-in learner to the profile capability. */
export class GetMyCvLinkHandler extends ICQRSHandler<GetMyCvLinkQuery, CvLinkView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly cv: ProfileCvService,
    ) {
        super(logger)
    }

    protected override process(query: GetMyCvLinkQuery): Promise<CvLinkView> {
        return this.cv.link({
            learnerId: query.params.principal.id,
            accountName: query.params.request.accountName,
        })
    }
}
