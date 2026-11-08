import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ResendCodeCommand } from "./resend-code.command"

@CommandHandler(ResendCodeCommand)
/** Delegates resend-code to identity's access service, which owns the scenario. */
export class ResendCodeHandler extends ICQRSHandler<ResendCodeCommand, void> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: ResendCodeCommand): Promise<void> {
        return this.access.resendCode(command.params.request)
    }
}
