import { CommandHandler } from "@nestjs/cqrs"
import { IdentityAccessService } from "@modules/domain/identity"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { VerifyPasswordResetCommand } from "./verify-password-reset.command"

@CommandHandler(VerifyPasswordResetCommand)
/** Delegates verify-password-reset to identity's access service, which owns the scenario. */
export class VerifyPasswordResetHandler extends ICQRSHandler<VerifyPasswordResetCommand, void> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly access: IdentityAccessService,
    ) {
        super(logger)
    }
    protected override process(command: VerifyPasswordResetCommand): Promise<void> {
        return this.access.verifyPasswordReset(command.params.request)
    }
}
