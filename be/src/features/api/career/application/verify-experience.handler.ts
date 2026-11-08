import { QueryHandler } from "@nestjs/cqrs"
import { ExperienceReadService, type VerificationView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { VerifyExperienceQuery } from "./verify-experience.query"

@QueryHandler(VerifyExperienceQuery)
/** Hands the message to the career capability, which authorizes and decides. */
export class VerifyExperienceHandler extends ICQRSHandler<VerifyExperienceQuery, VerificationView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ExperienceReadService,
    ) {
        super(logger)
    }

    protected override process(query: VerifyExperienceQuery): Promise<VerificationView> {
        return this.reads.verify(query.params.request.code)
    }
}
