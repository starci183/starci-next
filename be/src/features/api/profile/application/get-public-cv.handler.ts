import { QueryHandler } from "@nestjs/cqrs"
import { ProfileCvService, type PublicCvView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetPublicCvQuery } from "./get-public-cv.query"

@QueryHandler(GetPublicCvQuery)
/** Hands the public CV read to the profile capability, which answers only a CV its learner made public. */
export class GetPublicCvHandler extends ICQRSHandler<GetPublicCvQuery, PublicCvView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly cv: ProfileCvService,
    ) {
        super(logger)
    }

    protected override process(message: GetPublicCvQuery): Promise<PublicCvView> {
        return this.cv.publicCv({ slug: message.params.request.slug, locale: message.params.request.locale })
    }
}
