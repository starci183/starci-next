import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService, type ResetChallengeView } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RequestPasswordResetCommand } from "./request-password-reset.command"

@CommandHandler(RequestPasswordResetCommand)
/** Delegates request-password-reset to identity's access service, which owns the scenario. */
export class RequestPasswordResetHandler extends ICQRSHandler<RequestPasswordResetCommand, ResetChallengeView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: RequestPasswordResetCommand): Promise<ResetChallengeView> {
        return this.access.requestPasswordReset(command.params.request)
    }
}
