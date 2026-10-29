import { QueryHandler } from "@nestjs/cqrs"
import { SessionHttpService } from "@modules/domain/identity"
import type { IdentityReadResult } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { CurrentSessionQuery } from "./current-session.query"

@QueryHandler(CurrentSessionQuery)
/** Delegates current-session response policy to identity's session lifecycle. */
export class CurrentSessionHandler extends ICQRSHandler<CurrentSessionQuery, IdentityReadResult> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly sessions: SessionHttpService,
    ) {
        super(logger)
    }
    protected override process(query: CurrentSessionQuery): Promise<IdentityReadResult> {
        return this.sessions.current(query.params.request.reference)
    }
}
