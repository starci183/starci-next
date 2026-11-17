import { CommandHandler } from "@nestjs/cqrs"
import { ProfileService, type ProfileView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ConfirmAvatarUploadCommand } from "./confirm-avatar-upload.command"

@CommandHandler(ConfirmAvatarUploadCommand)
/** Hands the key to the profile capability, which checks it is the learner own and that the store holds what was asked. */
export class ConfirmAvatarUploadHandler extends ICQRSHandler<ConfirmAvatarUploadCommand, ProfileView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly profiles: ProfileService,
    ) {
        super(logger)
    }

    protected override process(command: ConfirmAvatarUploadCommand): Promise<ProfileView> {
        return this.profiles.confirmAvatar({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
