import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService, type SessionIssued } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { VerifySignInCommand } from "./verify-sign-in.command"

@CommandHandler(VerifySignInCommand)
/** Delegates verify-sign-in to identity's access service, which owns the scenario. */
export class VerifySignInHandler extends ICQRSHandler<VerifySignInCommand, SessionIssued> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: VerifySignInCommand): Promise<SessionIssued> {
        return this.access.verifySignIn(command.params.request)
    }
}
