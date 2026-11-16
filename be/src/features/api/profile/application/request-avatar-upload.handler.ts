import { CommandHandler } from "@nestjs/cqrs"
import { ProfileService, type AvatarUploadView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RequestAvatarUploadCommand } from "./request-avatar-upload.command"

@CommandHandler(RequestAvatarUploadCommand)
/** Hands the type and size to the profile capability, which holds them to its limits and signs the upload. */
export class RequestAvatarUploadHandler extends ICQRSHandler<RequestAvatarUploadCommand, AvatarUploadView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly profiles: ProfileService,
    ) {
        super(logger)
    }

    protected override process(command: RequestAvatarUploadCommand): Promise<AvatarUploadView> {
        return this.profiles.requestAvatarUpload({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
