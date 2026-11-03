import { CommandHandler } from "@nestjs/cqrs"
import { SessionHttpService } from "@modules/domain/identity"
import type { IdentityRedirectView } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { SignInCallbackCommand } from "./sign-in-callback.command"

@CommandHandler(SignInCallbackCommand)
/** Delegates sign-in-callback response policy to identity's session lifecycle. */
export class SignInCallbackHandler extends ICQRSHandler<SignInCallbackCommand, IdentityRedirectView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly sessions: SessionHttpService,
    ) {
        super(logger)
    }
    protected override process(command: SignInCallbackCommand): Promise<IdentityRedirectView> {
        return this.sessions.callback(command.params.request)
    }
}
