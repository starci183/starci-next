import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService, type ChallengeView } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SignInCommand } from "./sign-in.command"

@CommandHandler(SignInCommand)
/** Delegates sign-in to identity's access service, which owns the scenario. */
export class SignInHandler extends ICQRSHandler<SignInCommand, ChallengeView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: SignInCommand): Promise<ChallengeView> {
        return this.access.signIn(command.params.request)
    }
}
