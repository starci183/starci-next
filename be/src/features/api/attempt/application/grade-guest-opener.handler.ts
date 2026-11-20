import { QueryHandler } from "@nestjs/cqrs"
import { AttemptGuestService, type AttemptResult } from "@modules/domain/attempt"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GradeGuestOpenerQuery } from "./grade-guest-opener.query"

@QueryHandler(GradeGuestOpenerQuery)
/** Hands the choice of a guest to the attempt capability, which grades it without storing it. */
export class GradeGuestOpenerHandler extends ICQRSHandler<GradeGuestOpenerQuery, AttemptResult> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly guests: AttemptGuestService,
    ) {
        super(logger)
    }

    protected override process(query: GradeGuestOpenerQuery): Promise<AttemptResult> {
        return this.guests.grade(query.params.request)
    }
}
