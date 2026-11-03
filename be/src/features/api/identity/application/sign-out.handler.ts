import { CommandHandler } from "@nestjs/cqrs"
import { SessionHttpService } from "@modules/domain/identity"
import type { IdentityLogoutResult } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { SignOutCommand } from "./sign-out.command"

@CommandHandler(SignOutCommand)
/** Delegates sign-out response policy to identity's session lifecycle. */
export class SignOutHandler extends ICQRSHandler<SignOutCommand, IdentityLogoutResult> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly sessions: SessionHttpService,
    ) {
        super(logger)
    }
    protected override process(command: SignOutCommand): Promise<IdentityLogoutResult> {
        return this.sessions.signOut(command.params.request.reference)
    }
}
