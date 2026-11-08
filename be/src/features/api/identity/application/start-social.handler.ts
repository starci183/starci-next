import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService, type SocialStarted } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { StartSocialCommand } from "./start-social.command"

@CommandHandler(StartSocialCommand)
/** Delegates start-social to identity's access service, which owns the scenario. */
export class StartSocialHandler extends ICQRSHandler<StartSocialCommand, SocialStarted> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: StartSocialCommand): Promise<SocialStarted> {
        return this.access.startSocial(command.params.request)
    }
}
