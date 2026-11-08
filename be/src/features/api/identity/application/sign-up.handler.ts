import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService, type ChallengeView } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SignUpCommand } from "./sign-up.command"

@CommandHandler(SignUpCommand)
/** Delegates sign-up to identity's access service, which owns the scenario. */
export class SignUpHandler extends ICQRSHandler<SignUpCommand, ChallengeView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: SignUpCommand): Promise<ChallengeView> {
        return this.access.signUp(command.params.request)
    }
}
