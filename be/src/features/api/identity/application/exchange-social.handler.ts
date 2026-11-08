import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService, type SocialSessionIssued } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ExchangeSocialCommand } from "./exchange-social.command"

@CommandHandler(ExchangeSocialCommand)
/** Delegates exchange-social to identity's access service, which owns the scenario. */
export class ExchangeSocialHandler extends ICQRSHandler<ExchangeSocialCommand, SocialSessionIssued> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: ExchangeSocialCommand): Promise<SocialSessionIssued> {
        return this.access.exchangeSocial(command.params.request)
    }
}
