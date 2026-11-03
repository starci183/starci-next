import { CommandHandler } from "@nestjs/cqrs"
import { SessionHttpService } from "@modules/domain/identity"
import type { IdentityRedirectView } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { StartSignInCommand } from "./start-sign-in.command"

@CommandHandler(StartSignInCommand)
/** Delegates start-sign-in response policy to identity's session lifecycle. */
export class StartSignInHandler extends ICQRSHandler<StartSignInCommand, IdentityRedirectView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly sessions: SessionHttpService,
    ) {
        super(logger)
    }
    protected override process(): Promise<IdentityRedirectView> {
        return this.sessions.start()
    }
}
